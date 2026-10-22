// Renames a component ID or a variant slug everywhere it is used, so the URL changes with it:
//   component → /components/<id>: folder, <id>.config.ts, <id>-page.ts, base/<id>.ts|.html, styles/_<id>*.scss
//               and, inside them, the ID in every form (int-<id>, sk-<id>, --NOTE-<ID>, Int<Id>, <Id>Page,
//               <Id><Slug>Example, <id>-<slug>-example, imports and @use). Outside: inventory.ts and
//               catalog-groups.ts. With --title, also the title in the header of every base/<id>.html.
//   variant   → /components/<id>#<id>-<slug>: the variants/<slug>/ folder in every version that has it,
//               its selector and class in example.ts, the title in example.html and its config entry.
// Versions are never renamed. Without --yes it is a dry run: it prints what would change and touches
// nothing. At the end it regenerates src/generated/ (a running ng serve picks it up).
//
//   node scripts/rename.mjs component <component> <new-id> [--title "<Title>"] [--yes]
//   node scripts/rename.mjs variant <component> <slug> "<New title>" [--slug <new-slug>] [--yes]
//   npm run rename -- component slider slidering --title "Slidering" --yes
//   npm run rename -- variant accordion raiser "Raised" --yes
//
// <component> is the ID or the folder (button, demo, _demo_).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import {
  COMPONENTS_DIR,
  ROOT,
  findComponent,
  readVariantEntries,
  regenerateDocs,
  toPosix,
  toSlug,
  variantVersions,
  writeVariantEntries,
} from './component-files.mjs';

const INVENTORY = join(COMPONENTS_DIR, 'inventory.ts');
const CATALOG_GROUPS = join(ROOT, 'src', 'page', 'components', 'catalog', 'catalog-groups.ts');
const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const USAGE = [
  'Usage:',
  '  npm run rename -- component <component> <new-id> [--title "<Title>"] [--yes]',
  '  npm run rename -- variant <component> <slug> "<New title>" [--slug <new-slug>] [--yes]',
].join('\n');

/** "date-picker" → "DatePicker". */
const toPascal = (slug) => slug.replace(/(^|-)([a-z0-9])/g, (_, __, char) => char.toUpperCase());
/** "date-picker" → "datePicker" (variable name in inventory.ts). */
const toCamel = (slug) => slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
/** "date-picker" → "DATE-PICKER" (the --NOTE-<ID> token). */
const toUpper = (slug) => slug.toUpperCase();
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fail(message) {
  console.error(`[rename] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = { yes: false, title: undefined, slug: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--yes') flags.yes = true;
    else if (argv[i] === '--title') flags.title = (argv[++i] ?? '').trim();
    else if (argv[i] === '--slug') flags.slug = argv[++i];
    else positional.push(argv[i]);
  }
  return { positional, ...flags };
}

const { positional, yes, title, slug: slugFlag } = parseArgs(process.argv.slice(2));
const [kind, componentArg, from, ...rest] = positional;
if (!['component', 'variant'].includes(kind) || !componentArg || !from) fail(USAGE);

const component = findComponent(componentArg);
if (!component) fail(`Component "${componentArg}" not found in src/components/.`);

/** Planned changes: folder moves, file moves and content rewrites, applied in this order. */
const folderMoves = [];
const fileChanges = []; // { from, to, content } — `to` may equal `from`; content undefined = unchanged
const notes = [];

const filesUnder = (dir) =>
  readdirSync(dir, { recursive: true })
    .map((file) => join(dir, file))
    .filter((path) => statSync(path).isFile());

/** `title:` line of a header comment (base/<id>.html or example.html). */
const HEADER_TITLE = /(<!--[\s\S]*?^[ \t]*title:[ \t]*)(.*)$/m;
const readTitle = (file) => (existsSync(file) ? HEADER_TITLE.exec(readFileSync(file, 'utf8'))?.[2].trim() ?? '' : '');

// ─── Component ───────────────────────────────────────────────────────────────────────────────────

if (kind === 'component') {
  const oldId = component.id;
  const newId = from;
  if (!KEBAB_CASE.test(newId)) fail(`"${newId}" is not a valid ID: use kebab-case (slider, date-picker).`);
  if (newId === oldId) fail(`${oldId} already has that ID.`);
  // Fixed pages under /components (src/page/components/components.routes.ts).
  if (['skills', 'guide', 'status'].includes(newId)) fail(`"${newId}" is reserved for a Reference page (/components/${newId}).`);
  if (findComponent(newId)) fail(`A component "${newId}" already exists.`);
  const newDir = component.dir === oldId ? newId : component.dir.replace(oldId, newId);
  const newPath = join(COMPONENTS_DIR, newDir);

  const [oP, nP] = [toPascal(oldId), toPascal(newId)];
  const id = escape(oldId);
  // Every form of the ID inside the component folder. Plain words (an <input> in an example, the
  // title in a comment) are left alone: only names derived from the ID are matched.
  const rules = [
    [new RegExp(`(?<=\\b(?:int|sk)-)${id}(?![a-z0-9])`, 'g'), newId], // int-slider, sk-slider, int-slider__x
    [new RegExp(`\\bapp-${id}-page\\b`, 'g'), `app-${newId}-page`], // page selector
    [new RegExp(`(['"\`])${id}-([a-z0-9-]+-example)\\1`, 'g'), `$1${newId}-$2$1`], // example selectors
    [new RegExp(`(?<=['"/])${id}(?=(?:-page)?(?:\\.[\\w.-]+)?['"])`, 'g'), newId], // imports, @use, id: '…'
    [new RegExp(`/components/${id}(?![a-z0-9-])`, 'g'), `/components/${newId}`], // routes in comments
    [new RegExp(`\\bas ${id}(?=[-;])`, 'g'), `as ${newId}`], // @use '…' as slider-x;
    [new RegExp(`(?<![\\w-])${id}(?=(?:-page)?\\.[a-z<])`, 'g'), newId], // slider.config.ts, slider.html in comments
    ...(component.dir !== oldId ? [[new RegExp(`\\b${escape(component.dir)}(?![\\w-])`, 'g'), newDir]] : []), // _demo_
    [new RegExp(`--NOTE-${escape(toUpper(oldId))}(?![A-Z0-9-])`, 'g'), `--NOTE-${toUpper(newId)}`],
    [new RegExp(`\\bInt${oP}(?![a-z0-9])`, 'g'), `Int${nP}`], // IntSlider, IntSliderItem
    [new RegExp(`\\b${oP}(?=Page\\b|Example\\b|[A-Z]\\w*Example\\b)`, 'g'), nP], // SliderPage, SliderBasicExample
  ];

  // Title: header of every base/<id>.html, and the quoted title in the comments of config/page/routes.
  const oldTitle = readTitle(join(component.path, `version-${component.versions.at(-1)}`, 'base', `${oldId}.html`));

  folderMoves.push({ from: component.path, to: newPath });
  for (const file of filesUnder(component.path)) {
    const relative = file.slice(component.path.length + 1);
    // _slider.scss, _slider.outlined.scss, slider.ts, slider-page.ts, slider.config.ts
    const name = basename(relative).replace(new RegExp(`^(_?)${id}(?=[-.])`), `$1${newId}`);
    const target = join(newPath, dirname(relative), name);
    const source = readFileSync(file, 'utf8');
    let content = rules.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), source);
    if (title && oldTitle) {
      if (name === `${newId}.html` && /[\\/]base$/.test(dirname(relative))) {
        content = content.replace(HEADER_TITLE, `$1${title}`);
      } else if (dirname(relative) === '.') {
        content = content.replaceAll(`"${oldTitle}"`, `"${title}"`);
      }
    }
    fileChanges.push({ from: file, to: target, content: content === source ? undefined : content });
  }

  // inventory.ts: import path and variable.
  const inventory = readFileSync(INVENTORY, 'utf8');
  const importLine = new RegExp(`^import (\\w+) from '\\./${escape(component.dir)}/${id}\\.config';`, 'm');
  const variable = importLine.exec(inventory)?.[1];
  if (variable) {
    const newVariable = toCamel(newId);
    const content = inventory
      .replace(importLine, `import ${newVariable} from './${newDir}/${newId}.config';`)
      .replace(new RegExp(`^([ \\t]*)${variable},`, 'm'), `$1${newVariable},`);
    fileChanges.push({ from: INVENTORY, to: INVENTORY, content });
  } else {
    notes.push(`${toPosix(INVENTORY)}: no import of ${component.dir}/${oldId}.config (skipped)`);
  }

  // catalog-groups.ts: ID in its group and icon key.
  if (existsSync(CATALOG_GROUPS)) {
    const groups = readFileSync(CATALOG_GROUPS, 'utf8');
    const key = /^[a-z]\w*$/.test(newId) ? newId : `'${newId}'`;
    const content = groups
      .replace(new RegExp(`'${id}'(?=[,\\]])`), `'${newId}'`)
      .replace(new RegExp(`^([ \\t]*)'?${id}'?(\\s*:\\s*'pi-)`, 'm'), `$1${key}$2`);
    if (content !== groups) fileChanges.push({ from: CATALOG_GROUPS, to: CATALOG_GROUPS, content });
  }

  notes.push(`URL: /components/${oldId} → /components/${newId} (the old link stops working)`);
  notes.push(`Selector: <int-${oldId}> → <int-${newId}>, classes .int-${oldId}* → .int-${newId}*`);
  if (title) notes.push(`Title: "${oldTitle}" → "${title}"`);

  // Other mentions of the old ID (guides, other components): reported, never edited.
  const mention = new RegExp(`['"/]${id}['"#?/\\s]|int-${id}\\b`);
  const srcDir = join(ROOT, 'src');
  const mentions = filesUnder(srcDir).filter(
    (path) =>
      /\.(ts|html|scss)$/.test(path) &&
      !path.startsWith(component.path) &&
      !/[\\/]generated[\\/]/.test(path) &&
      path !== INVENTORY &&
      path !== CATALOG_GROUPS &&
      mention.test(readFileSync(path, 'utf8')),
  );
  if (mentions.length) notes.push(`Still mentioned in (review by hand): ${mentions.map(toPosix).join(', ')}`);
}

// ─── Variant ─────────────────────────────────────────────────────────────────────────────────────

if (kind === 'variant') {
  const oldSlug = from;
  const newTitle = rest.join(' ').trim();
  if (!newTitle) fail(USAGE);
  const newSlug = slugFlag ?? toSlug(newTitle);
  if (!KEBAB_CASE.test(newSlug)) fail(`"${newSlug}" is not a valid folder name: use kebab-case.`);

  const folders = variantVersions(component);
  const versions = folders.get(oldSlug);
  if (!versions) fail(`Variant "${oldSlug}" not found in ${component.id} (variants: ${[...folders.keys()].join(', ')}).`);
  if (oldSlug === 'basic' && newSlug !== 'basic') fail('"basic" is the default variant of every component: its folder is not renamed (only its title).');
  if (newSlug !== oldSlug && folders.has(newSlug)) fail(`${component.id} already has a variant "${newSlug}".`);

  const id = component.id;
  const P = toPascal(id);
  for (const version of versions) {
    const oldDir = join(component.path, `version-${version}`, 'variants', oldSlug);
    const newDir = join(component.path, `version-${version}`, 'variants', newSlug);
    if (newDir !== oldDir) folderMoves.push({ from: oldDir, to: newDir });
    for (const file of filesUnder(oldDir)) {
      const source = readFileSync(file, 'utf8');
      let content = source
        .replace(new RegExp(`(['"\`])${escape(id)}-${escape(oldSlug)}-example\\1`, 'g'), `$1${id}-${newSlug}-example$1`)
        .replace(new RegExp(`\\b${P}${toPascal(oldSlug)}Example\\b`, 'g'), `${P}${toPascal(newSlug)}Example`);
      if (basename(file) === 'example.html') content = content.replace(HEADER_TITLE, `$1${newTitle}`);
      fileChanges.push({
        from: file,
        to: join(newDir, file.slice(oldDir.length + 1)),
        content: content === source ? undefined : content,
      });
    }
  }

  // Config entry: a slug string becomes the new slug; an object gets its slug/name updated.
  if (existsSync(component.config) && newSlug !== oldSlug) {
    const source = readFileSync(component.config, 'utf8');
    const entries = readVariantEntries(source)?.entries;
    if (entries?.some((e) => e.slug === oldSlug)) {
      const texts = entries.map((e) => {
        if (e.slug !== oldSlug) return e.text;
        if (/^['"`]/.test(e.text)) return `'${newSlug}'`;
        return /\bslug\s*:/.test(e.text)
          ? e.text.replace(/(\bslug\s*:\s*)(['"`]).*?\2/, `$1'${newSlug}'`)
          : e.text.replace(/(\bname\s*:\s*)(['"`]).*?\2/, `$1'${newTitle.replace(/'/g, "\\'")}'`);
      });
      fileChanges.push({ from: component.config, to: component.config, content: writeVariantEntries(source, texts) });
    }
  }

  if (newSlug !== oldSlug) {
    notes.push(`URL: /components/${id}#${id}-${oldSlug} → /components/${id}#${id}-${newSlug}`);
    if (versions.length > 1) notes.push(`Renamed in versions ${versions.join(', ')} (all that have it)`);
    const modifier = component.versions
      .map((v) => join(component.path, `version-${v}`, 'styles', `_${id}.${oldSlug}.scss`))
      .filter(existsSync);
    if (modifier.length) notes.push(`SCSS modifier with the old name, not renamed (decides the maquetador): ${modifier.map(toPosix).join(', ')}`);
  }
}

// ─── Report and apply ────────────────────────────────────────────────────────────────────────────

console.log(`[rename] ${yes ? 'Renaming' : 'Dry run (nothing changes)'} · ${kind} · ${component.id}`);
for (const move of folderMoves) console.log(`  move    ${toPosix(move.from)}/ → ${toPosix(move.to)}/`);
for (const change of fileChanges) {
  const moved = basename(change.from) !== basename(change.to);
  if (!moved && change.content === undefined) continue;
  const label = moved ? `${toPosix(change.from)} → ${basename(change.to)}` : toPosix(change.to);
  console.log(`  ${moved ? 'rename ' : 'update '} ${label}${moved && change.content !== undefined ? ' (+ content)' : ''}`);
}
for (const note of notes) console.log(`  · ${note}`);

if (!yes) {
  console.log('[rename] Add --yes to apply.');
  process.exit(0);
}

// Folders are not renamed in place: on Windows a running ng serve or the editor keeps a handle on them
// (EPERM). Every file is written at its new path first, then the old folders are deleted.
for (const change of fileChanges) {
  if (change.from === change.to) {
    if (change.content !== undefined) writeFileSync(change.to, change.content);
    continue;
  }
  mkdirSync(dirname(change.to), { recursive: true });
  writeFileSync(change.to, change.content ?? readFileSync(change.from));
}
for (const move of folderMoves) {
  try {
    rmSync(move.from, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (error) {
    console.warn(`[rename] Could not delete ${toPosix(move.from)}/ (${error.code}): close what uses it and delete it by hand.`);
  }
}
console.log('[rename] Done.');

regenerateDocs();
