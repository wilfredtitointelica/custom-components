// Moves a documentation example between the two tabs of its page, keeping its slug, so the URL
// /components/<id>#<id>-<slug> keeps working:
//   variants/<slug>/     (Variants tab)     ⇄ compositions/<slug>/ (Compositions tab)
// in every version that has it. Its class and selector (<Id><Slug>Example, <id>-<slug>-example) do not
// change; its entry moves from the `variants` list of <id>.config.ts to `compositions` (or back),
// keeping its text (description, hidden). Without --yes it is a dry run: it prints what would change
// and touches nothing. At the end it regenerates src/generated/ (a running ng serve picks it up).
//
//   node scripts/move-example.mjs <component> <slug> --to composition|variant [--yes]
//   npm run move -- card kpi --to composition --yes
//
// <component> is the ID or the folder (button, demo, _demo_).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  exampleKind,
  findComponent,
  isDefaultOrder,
  readVariantEntries,
  regenerateDocs,
  toPosix,
  variantVersions,
  writeVariantEntries,
} from './component-files.mjs';

const USAGE = 'Usage: npm run move -- <component> <slug> --to composition|variant [--yes]';
/** --to value → example folder and config list. */
const TARGETS = { composition: 'compositions', variant: 'variants' };

function fail(message) {
  console.error(`[move] ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const yes = args.includes('--yes');
const toIndex = args.indexOf('--to');
const to = TARGETS[args[toIndex + 1]];
const [componentArg, slug] = args.filter((arg, i) => !arg.startsWith('--') && i !== toIndex + 1);
if (!componentArg || !slug || toIndex < 0 || !to) fail(USAGE);

const component = findComponent(componentArg);
if (!component) fail(`Component "${componentArg}" not found in src/components/.`);
const from = exampleKind(component, slug);
if (!from) fail(`"${slug}" not found in ${component.id} (neither variants/ nor compositions/).`);
if (from === to) fail(`${component.id} › ${slug} is already in ${to}/.`);
if (slug === 'basic') fail('"basic" is the default variant of every component: it stays in variants/.');

const versions = variantVersions(component, from).get(slug);
const filesUnder = (dir) =>
  readdirSync(dir, { recursive: true })
    .map((file) => join(dir, file))
    .filter((path) => statSync(path).isFile());

/** Planned changes: every file copied to its new folder, then the old folders deleted. */
const fileMoves = [];
const oldFolders = [];
for (const version of versions) {
  const oldDir = join(component.path, `version-${version}`, from, slug);
  const newDir = join(component.path, `version-${version}`, to, slug);
  if (existsSync(newDir)) fail(`${toPosix(newDir)}/ already exists.`);
  oldFolders.push({ oldDir, newDir });
  for (const file of filesUnder(oldDir)) {
    fileMoves.push({ from: file, to: join(newDir, file.slice(oldDir.length + 1)) });
  }
}

// Config: the entry leaves its list (with its text) and goes to the end of the other one. A plain slug
// in the default order adds nothing, so a list that only holds that is not written.
let config;
if (existsSync(component.config)) {
  const source = readFileSync(component.config, 'utf8');
  const fromEntries = readVariantEntries(source, from)?.entries ?? [];
  const entry = fromEntries.find((e) => e.slug === slug);
  const toEntries = readVariantEntries(source, to)?.entries;
  let content = source;
  if (entry) {
    const kept = fromEntries.filter((e) => e !== entry);
    content = writeVariantEntries(content, isDefaultOrder(kept) ? [] : kept.map((e) => e.text), from);
  }
  // Without an existing target list, a plain slug needs no entry: the folder is detected anyway.
  const plain = !entry || /^['"`]/.test(entry.text);
  if (toEntries || !plain) {
    const text = entry?.text ?? `'${slug}'`;
    content = writeVariantEntries(content, [...(toEntries ?? []).map((e) => e.text), text], to);
  }
  if (content !== source) config = content;
}

console.log(`[move] ${yes ? 'Moving' : 'Dry run (nothing changes)'} · ${component.id} › ${slug} · ${from}/ → ${to}/`);
for (const { oldDir, newDir } of oldFolders) console.log(`  move    ${toPosix(oldDir)}/ → ${toPosix(newDir)}/`);
if (config) console.log(`  update  ${toPosix(component.config)} (${from} → ${to})`);
console.log(`  · URL unchanged: /components/${component.id}#${component.id}-${slug} (now in the ${to === 'compositions' ? 'Compositions' : 'Variants'} tab)`);

if (!yes) {
  console.log('[move] Add --yes to apply.');
  process.exit(0);
}

// Folders are not renamed in place: on Windows a running ng serve or the editor keeps a handle on them
// (EPERM). Every file is written at its new path first, then the old folders are deleted.
for (const move of fileMoves) {
  mkdirSync(dirname(move.to), { recursive: true });
  writeFileSync(move.to, readFileSync(move.from));
}
if (config) writeFileSync(component.config, config);
for (const { oldDir } of oldFolders) {
  try {
    rmSync(oldDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (error) {
    console.warn(`[move] Could not delete ${toPosix(oldDir)}/ (${error.code}): close what uses it and delete it by hand.`);
  }
}
console.log('[move] Done.');

regenerateDocs();
