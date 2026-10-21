// Sets the implementation status of one version of a component: the static property of its base class
//   src/components/<component>/version-<N>/base/<id>.ts
//     static readonly status: 'pending' | 'in-progress' | 'done' = '<status>';
// The documentation page shows it as a chip (Pending / In progress / Done). If the class has no such
// property yet (older base), it is inserted as the first line of the class. Only that line changes.
//
//   node scripts/set-status.mjs <component> <status> [--version <N>]
//   npm run set:status -- button in-progress
//   npm run set:status -- demo done --version 1
//
// <component> is the ID or the folder (button, demo, _demo_). Without --version, the latest version-N.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const VERSION_FOLDER = /^version-(\d+)$/;
/** Same values as ComponentStatus (src/service/catalog.model.ts), in workflow order. */
const STATUSES = ['pending', 'in-progress', 'done'];
const STATUS_TYPE = STATUSES.map((status) => `'${status}'`).join(' | ');
const STATUS_PROPERTY = /(static\s+readonly\s+status\b)[^=;]*=\s*(['"])[\w-]+\2;?/;

const toPosix = (path) => relative(ROOT, path).replace(/\\/g, '/');

function fail(message) {
  console.error(`[set-status] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let version;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version') version = Number(argv[++i]);
    else positional.push(argv[i]);
  }
  const [component, status] = positional;
  if (!component || !status || positional.length > 2) {
    fail(`Usage: npm run set:status -- <component> <${STATUSES.join('|')}> [--version <N>]`);
  }
  if (!STATUSES.includes(status)) fail(`Status must be one of: ${STATUSES.join(', ')}.`);
  if (version !== undefined && !(version > 0)) fail('--version must be a positive number.');
  return { component, status, version };
}

const { component, status, version } = parseArgs(process.argv.slice(2));

// Component folder: exact name, or the ID wrapped in underscores (reference folders such as _demo_).
const dir = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .find((folder) => folder === component || folder.replace(/^_+|_+$/g, '') === component);
if (!dir) fail(`Component "${component}" not found in src/components/.`);
const id = dir.replace(/^_+|_+$/g, '');

const versions = readdirSync(join(COMPONENTS_DIR, dir))
  .map((folder) => Number(VERSION_FOLDER.exec(folder)?.[1]))
  .filter((n) => n > 0)
  .sort((a, b) => a - b);
if (!versions.length) fail(`${dir}/ has no version-N folder.`);
const target = version ?? versions.at(-1);
if (!versions.includes(target)) fail(`${dir}/version-${target}/ does not exist (versions: ${versions.join(', ')}).`);

const file = join(COMPONENTS_DIR, dir, `version-${target}`, 'base', `${id}.ts`);
if (!existsSync(file)) fail(`Missing base file: ${toPosix(file)}`);

const source = readFileSync(file, 'utf8');
const line = `static readonly status: ${STATUS_TYPE} = '${status}';`;
let updated;
if (STATUS_PROPERTY.test(source)) {
  updated = source.replace(STATUS_PROPERTY, line);
} else {
  // Older base without the property: first line of the class body.
  const classOpen = /^(export class \w+\s*\{)(\})?/m;
  if (!classOpen.test(source)) fail(`No "export class" found in ${toPosix(file)}.`);
  const property =
    '\n  /** Implementation status, shown on the documentation page: pending → in-progress → done. */\n' +
    `  ${line}\n`;
  updated = source.replace(classOpen, (_, open, close) => `${open}${property}${close ? '}' : ''}`);
}

if (updated === source) {
  console.log(`[set-status] ${toPosix(file)} is already '${status}'.`);
} else {
  writeFileSync(file, updated);
  console.log(`[set-status] ${toPosix(file)} → '${status}'`);
}
console.log(`[set-status] Page: /components/${id}?version=${target}`);

// Refresh src/generated/ (a running ng serve picks it up).
spawnSync(process.execPath, [join(ROOT, 'scripts', 'generate-docs.mjs')], { stdio: 'inherit' });
