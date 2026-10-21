// Scaffolds a documentation example: src/components/<component>/version-<N>/variants/<slug>/
//   example.ts   → one component that imports the base (Int<Id>) and nothing else
//   example.html → header comment with the title and description, and an empty body: the page shows
//                  "Preview pending" until the maquetador writes the example below the header
// The folder is registered by scripts/generate-docs.mjs, which this script runs at the end, so the new
// section shows up even with a plain `ng serve`: no import or registration needed.
//
//   node scripts/new-variant.mjs <component> "<Title>" [--description "<Description>"] [--version <N>]
//   npm run new:variant -- accordion "Icons + Border" --description "Icon and border together."
//
// <component> is the ID or the folder (button, demo, _demo_). Without --version, the latest version-N.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const VERSION_FOLDER = /^version-(\d+)$/;

/** Same rule as src/service/slug.ts: "Icons + Border" → "icons-border", "RadioButton" → "radio-button". */
const toSlug = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** "icons-border" → "IconsBorder". */
const toPascal = (slug) => slug.replace(/(^|-)([a-z0-9])/g, (_, __, char) => char.toUpperCase());

function fail(message) {
  console.error(`[new-variant] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let version;
  let description = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version') version = Number(argv[++i]);
    else if (argv[i] === '--description') description = (argv[++i] ?? '').trim();
    else positional.push(argv[i]);
  }
  const [component, ...name] = positional;
  if (!component || !name.length) {
    fail('Usage: npm run new:variant -- <component> "<Title>" [--description "<Description>"] [--version <N>]');
  }
  return { component, name: name.join(' ').trim(), description, version };
}

const { component, name, description, version } = parseArgs(process.argv.slice(2));

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
const number = version ?? versions.at(-1);
if (!versions.includes(number)) {
  fail(`${dir}/version-${version ?? '?'} does not exist (available: ${versions.join(', ') || 'none'}).`);
}
const versionDir = join(COMPONENTS_DIR, dir, `version-${number}`);

// The base component: version-N/base/<id>.ts → its exported class (IntButton).
const baseFile = join(versionDir, 'base', `${id}.ts`);
if (!existsSync(baseFile)) fail(`Missing base component: ${relative(ROOT, baseFile)}`);
const baseClass = /export class (\w+)/.exec(readFileSync(baseFile, 'utf8'))?.[1];
if (!baseClass) fail(`No exported class in ${relative(ROOT, baseFile)}`);

const slug = toSlug(name);
if (!slug) fail(`"${name}" does not produce a valid folder name.`);
const exampleDir = join(versionDir, 'variants', slug);
if (existsSync(exampleDir)) fail(`${relative(ROOT, exampleDir).replace(/\\/g, '/')}/ already exists.`);

mkdirSync(exampleDir, { recursive: true });
writeFileSync(
  join(exampleDir, 'example.ts'),
  `import { Component } from '@angular/core';

import { ${baseClass} } from '../../base/${id}';

@Component({
  selector: '${id}-${slug}-example',
  templateUrl: './example.html',
  imports: [${baseClass}],
})
export class ${toPascal(id)}${toPascal(slug)}Example {}
`,
);
// Header read by scripts/generate-docs.mjs (Angular drops comments). Empty body = "Preview pending".
writeFileSync(
  join(exampleDir, 'example.html'),
  `<!--\n  title: ${name}\n  description:${description && ` ${description}`}\n-->\n`,
);

console.log(`[new-variant] Created ${relative(ROOT, exampleDir).replace(/\\/g, '/')}/ (example.ts + example.html)`);
console.log(`[new-variant] Section id: ${id}-${slug} → /components/${id}#${id}-${slug}`);

// Register the new folder in src/generated/ (a running ng serve picks it up).
spawnSync(process.execPath, [join(ROOT, 'scripts', 'generate-docs.mjs')], { stdio: 'inherit' });
