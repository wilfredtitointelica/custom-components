// Removes a variant, a version or a whole component, and cleans what points to it, so the build never
// imports a folder that no longer exists:
//   variant   → version-<N>/variants/<slug>/ (one version or all); its entry in `variants` of
//               <id>.config.ts when no version has that folder anymore
//   version   → version-<N>/ (never the only one: remove the component instead); config entries of the
//               variants that only lived there. Versions are not renumbered (links ?version=N keep working)
//   component → src/components/<dir>/, its import and entry in src/components/inventory.ts, and its ID in
//               src/page/components/catalog/catalog-groups.ts (group and icon)
// Without --yes it is a dry run: it prints what would be removed and touches nothing. At the end it
// regenerates src/generated/, so a running ng serve does not fail on a deleted import.
//
//   node scripts/remove.mjs variant <component> <slug> [--version <N> | --all] [--allow-basic] [--yes]
//   node scripts/remove.mjs version <component> <N> [--yes]
//   node scripts/remove.mjs component <component> [--yes]
//   npm run remove -- variant accordion raiser --yes
//
// <component> is the ID or the folder (button, demo, _demo_).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COMPONENTS_DIR,
  ROOT,
  findComponent,
  isDefaultOrder,
  readHiddenVersions,
  readVariantEntries,
  setConfigProperty,
  regenerateDocs,
  toPosix,
  variantVersions,
  writeVariantEntries,
} from './component-files.mjs';

const INVENTORY = join(COMPONENTS_DIR, 'inventory.ts');
const CATALOG_GROUPS = join(ROOT, 'src', 'page', 'components', 'catalog', 'catalog-groups.ts');
const USAGE = [
  'Usage:',
  '  npm run remove -- variant <component> <slug> [--version <N> | --all] [--allow-basic] [--yes]',
  '  npm run remove -- version <component> <N> [--yes]',
  '  npm run remove -- component <component> [--yes]',
].join('\n');

function fail(message) {
  console.error(`[remove] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = { yes: false, all: false, allowBasic: false, version: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--yes') flags.yes = true;
    else if (argv[i] === '--all') flags.all = true;
    else if (argv[i] === '--allow-basic') flags.allowBasic = true;
    else if (argv[i] === '--version') flags.version = Number(argv[++i]);
    else positional.push(argv[i]);
  }
  return { positional, ...flags };
}

const { positional, yes, all, allowBasic, version } = parseArgs(process.argv.slice(2));
const [kind, componentArg, target] = positional;
if (!['variant', 'version', 'component'].includes(kind) || !componentArg) fail(USAGE);

const component = findComponent(componentArg);
if (!component) fail(`Component "${componentArg}" not found in src/components/.`);

/** Planned changes: folders to delete and files to rewrite ({ file, content, note }). */
const folders = [];
const rewrites = [];

/** Config entries of variants that no longer have a folder in any version once `removed` is gone. */
function planConfigCleanup(removedSlugs) {
  if (!existsSync(component.config)) return;
  const source = readFileSync(component.config, 'utf8');
  const entries = readVariantEntries(source)?.entries;
  if (!entries) return;
  const kept = entries.filter((e) => !removedSlugs.includes(e.slug));
  if (kept.length === entries.length) return;
  rewrites.push({
    file: component.config,
    content: writeVariantEntries(source, isDefaultOrder(kept) ? [] : kept.map((e) => e.text)),
    note: `variants: remove ${removedSlugs.filter((s) => entries.some((e) => e.slug === s)).join(', ')}`,
  });
}

/** Slugs whose only folders are inside the ones being removed. */
function orphanedSlugs(isRemoved) {
  return [...variantVersions(component)]
    .filter(([slug, versions]) => versions.every((v) => isRemoved(slug, v)))
    .map(([slug]) => slug);
}

if (kind === 'variant') {
  const slug = target;
  if (!slug) fail(USAGE);
  const versionsOf = variantVersions(component).get(slug);
  if (!versionsOf) {
    const available = [...variantVersions(component).keys()].join(', ') || 'none';
    fail(`Variant "${slug}" not found in ${component.id} (variants: ${available}).`);
  }
  if (slug === 'basic' && !allowBasic) {
    fail('"basic" is the default variant of every component. Pass --allow-basic to remove it anyway.');
  }
  let targets;
  if (all) targets = versionsOf;
  else if (version !== undefined) {
    if (!versionsOf.includes(version)) {
      fail(`${component.id}/version-${version} has no "${slug}" (it exists in version ${versionsOf.join(', ')}).`);
    }
    targets = [version];
  } else if (versionsOf.length === 1) targets = versionsOf;
  else fail(`"${slug}" exists in versions ${versionsOf.join(', ')}: pass --version <N> or --all.`);

  for (const n of targets) folders.push(join(component.path, `version-${n}`, 'variants', slug));
  planConfigCleanup(orphanedSlugs((s, v) => s === slug && targets.includes(v)));
}

if (kind === 'version') {
  const number = Number(target);
  if (!(number > 0)) fail(USAGE);
  if (!component.versions.includes(number)) {
    fail(`${component.dir}/version-${number}/ does not exist (versions: ${component.versions.join(', ')}).`);
  }
  if (component.versions.length === 1) {
    fail(`version-${number} is the only version of ${component.id}: remove the component instead.`);
  }
  folders.push(join(component.path, `version-${number}`));
  planConfigCleanup(orphanedSlugs((_, v) => v === number));
  // A hidden version that no longer exists leaves hiddenVersions.
  const config = rewrites.find((r) => r.file === component.config);
  const source = config?.content ?? (existsSync(component.config) ? readFileSync(component.config, 'utf8') : '');
  const hidden = readHiddenVersions(source);
  if (hidden.includes(number)) {
    const left = hidden.filter((n) => n !== number);
    const content = setConfigProperty(source, 'hiddenVersions', left.length ? `[${left.join(', ')}]` : undefined);
    if (config) {
      config.content = content;
      config.note += `; hiddenVersions: remove ${number}`;
    } else rewrites.push({ file: component.config, content, note: `hiddenVersions: remove ${number}` });
  }
}

if (kind === 'component') {
  if (existsSync(component.config) && /\breference\s*:\s*true\b/.test(readFileSync(component.config, 'utf8'))) {
    fail(`${component.id} is a reference implementation (reference: true): it is not removed.`);
  }
  folders.push(component.path);

  // inventory.ts: the import of its config and its entry in COMPONENT_INVENTORY.
  const inventory = readFileSync(INVENTORY, 'utf8');
  const importLine = new RegExp(`^import (\\w+) from '\\./${component.dir}/${component.id}\\.config';\\r?\\n`, 'm');
  const variable = importLine.exec(inventory)?.[1];
  if (variable) {
    rewrites.push({
      file: INVENTORY,
      content: inventory.replace(importLine, '').replace(new RegExp(`^[ \\t]*${variable},.*\\r?\\n`, 'm'), ''),
      note: `import ${variable} + entry in COMPONENT_INVENTORY`,
    });
  } else {
    console.warn(`[remove] ${toPosix(INVENTORY)}: no import of ${component.dir}/${component.id}.config (skipped).`);
  }

  // catalog-groups.ts: its ID in a group and its icon.
  if (existsSync(CATALOG_GROUPS)) {
    const groups = readFileSync(CATALOG_GROUPS, 'utf8');
    const quoted = `'${component.id}'`;
    const updated = groups
      .replace(new RegExp(`${quoted}, |, ${quoted}(?=\\])|${quoted}`), '')
      .replace(new RegExp(`^[ \\t]*'?${component.id}'?\\s*:\\s*'[^']*',\\r?\\n`, 'm'), '');
    if (updated !== groups) rewrites.push({ file: CATALOG_GROUPS, content: updated, note: 'group ID + icon' });
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────────────────────────

/** Files under the folder that git cannot restore (untracked or with uncommitted changes). */
function uncommitted(path) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', path], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.split('\n').filter(Boolean) : [];
}

console.log(`[remove] ${yes ? 'Removing' : 'Dry run (nothing is deleted)'} · ${kind} · ${component.id}`);
for (const folder of folders) {
  console.log(`  delete  ${toPosix(folder)}/`);
  const pending = uncommitted(folder);
  if (pending.length) {
    console.log(`          ⚠ ${pending.length} file(s) not committed: git cannot restore them`);
    for (const line of pending.slice(0, 10)) console.log(`            ${line}`);
  }
}
for (const { file, note } of rewrites) console.log(`  update  ${toPosix(file)} (${note})`);

if (kind === 'version') {
  const left = component.versions.filter((n) => n !== Number(target));
  console.log(`  versions left: ${left.join(', ')} (not renumbered)`);
}

// Other mentions of a removed component (docs, examples): reported, never edited.
if (kind === 'component') {
  const mentions = [];
  const srcDir = join(ROOT, 'src');
  // Its ID as a string or route segment ('card', /components/card) or its selector/class (int-card).
  const mention = new RegExp(`['"/]${component.id}['"#?/\\s]|int-${component.id}\\b`);
  for (const file of readdirSync(srcDir, { recursive: true })) {
    const path = join(srcDir, file);
    if (!/\.(ts|html|scss)$/.test(file) || path.startsWith(component.path) || /[\\/]generated[\\/]/.test(path)) continue;
    if (path === INVENTORY || path === CATALOG_GROUPS) continue;
    if (mention.test(readFileSync(path, 'utf8'))) mentions.push(toPosix(path));
  }
  if (mentions.length) console.log(`  still mentioned in (review by hand): ${mentions.join(', ')}`);
}

if (!yes) {
  console.log('[remove] Add --yes to apply.');
  process.exit(0);
}

// Retries: on Windows a running ng serve or the editor may hold the folder for a moment (EPERM/EBUSY).
for (const folder of folders) rmSync(folder, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
for (const { file, content } of rewrites) writeFileSync(file, content);
console.log('[remove] Done.');

// Drop the deleted folders from src/generated/ (a running ng serve picks it up).
regenerateDocs();
