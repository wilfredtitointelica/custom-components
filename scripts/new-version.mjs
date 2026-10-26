// Opens a new implementation version of a component: copies the latest
// src/components/<component>/version-<N>/ (base/, variants/ and styles/) to version-<N+1>/.
//   base/<id>.ts   → the "· version N" doc comment becomes "· version N+1"; the static `status` resets to 'pending'
//   base/<id>.html → header kept as is, unless --title / --description are given
// The copy is the starting point: the maquetador changes base/ and styles/ in the new version, and
// version-<N> stays untouched. The folder is registered by scripts/generate-docs.mjs, which this script
// runs at the end, so the version selector shows up even with a plain `ng serve`.
//
//   node scripts/new-version.mjs <component> [--title "<Title>"] [--description "<Description>"]
//   npm run new:version -- button --description "Pill shape and icon slot."
//
// <component> is the ID or the folder (button, demo, _demo_). The source is always the latest version-N.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const VERSION_FOLDER = /^version-(\d+)$/;
/** Header comment at the top of base/<id>.html, read by the documentation. */
const HEADER = /^\s*<!--([\s\S]*?)-->/;

const toPosix = (path) => relative(ROOT, path).replace(/\\/g, '/');

function fail(message) {
  console.error(`[new-version] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let title;
  let description;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--title') title = (argv[++i] ?? '').trim();
    else if (argv[i] === '--description') description = (argv[++i] ?? '').trim();
    else positional.push(argv[i]);
  }
  const [component] = positional;
  if (!component || positional.length > 1) {
    fail('Usage: npm run new:version -- <component> [--title "<Title>"] [--description "<Description>"]');
  }
  return { component, title, description };
}

const { component, title, description } = parseArgs(process.argv.slice(2));

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
if (!versions.length) fail(`${dir}/ has no version-N folder to start from.`);
const latest = versions.at(-1);
const next = latest + 1;
const sourceDir = join(COMPONENTS_DIR, dir, `version-${latest}`);
const targetDir = join(COMPONENTS_DIR, dir, `version-${next}`);
if (existsSync(targetDir)) fail(`${toPosix(targetDir)}/ already exists.`);

const baseTs = join(sourceDir, 'base', `${id}.ts`);
const baseHtml = join(sourceDir, 'base', `${id}.html`);
for (const file of [baseTs, baseHtml]) {
  if (!existsSync(file)) fail(`Missing base file: ${toPosix(file)}`);
}

cpSync(sourceDir, targetDir, { recursive: true });

// base/<id>.ts: "/** <int-button> · version 1… */" → "· version 2". Only the doc comment.
// A new version is work not started yet: the `static readonly status` copied from the previous one
// goes back to 'pending' (the previous version keeps its own).
const targetTs = join(targetDir, 'base', `${id}.ts`);
writeFileSync(
  targetTs,
  readFileSync(targetTs, 'utf8')
    .replace(new RegExp(`(<int-${id}>\\s*·\\s*version\\s+)${latest}\\b`), `$1${next}`)
    .replace(/(static\s+readonly\s+status\b[^=;]*=\s*)(['"])[\w-]+\2/, "$1'pending'"),
);

// base/<id>.html: rewrite only the header fields that were given.
if (title !== undefined || description !== undefined) {
  const targetHtml = join(targetDir, 'base', `${id}.html`);
  const html = readFileSync(targetHtml, 'utf8');
  const current = HEADER.exec(html)?.[1] ?? '';
  // Same layout the documentation reads: "title:" on one line, "description:" up to the next key or
  // the end, optional "figma:" link kept as is (copied from the previous version).
  const newTitle = title ?? /title:(.*)/.exec(current)?.[1].trim() ?? '';
  const newDescription =
    description ?? /description:([\s\S]*?)(?=^\s*figma:|$(?![\s\S]))/m.exec(current)?.[1].trim() ?? '';
  const figma = /^\s*figma:(.*)$/m.exec(current)?.[1].trim();
  const header =
    `<!--\n  title: ${newTitle}\n  description:${newDescription && ` ${newDescription}`}\n` +
    `${figma ? `  figma: ${figma}\n` : ''}-->`;
  writeFileSync(targetHtml, HEADER.test(html) ? html.replace(HEADER, header) : `${header}\n${html}`);
}

const examples = existsSync(join(targetDir, 'variants'))
  ? readdirSync(join(targetDir, 'variants'), { withFileTypes: true }).filter((e) => e.isDirectory()).length
  : 0;
console.log(`[new-version] Created ${toPosix(targetDir)}/ from version-${latest} (${examples} variants copied)`);
console.log(`[new-version] Page: /components/${id}?version=${next}`);

// Register the new folder in src/generated/ (a running ng serve picks it up).
spawnSync(process.execPath, [join(ROOT, 'scripts', 'generate-docs.mjs')], { stdio: 'inherit' });
