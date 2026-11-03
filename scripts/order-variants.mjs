// Lists or sets the menu order of the variants of a component: the `variants` list of
//   src/components/<component>/<id>.config.ts
// Variants are the version-N/variants/<slug>/ folders of every version (the menu merges them), so the
// order is per component, not per version. Folders the list does not name go after the listed ones
// ("basic" first, then alphabetical). Entries are written as slugs, so renaming a title in example.html
// never breaks the order; hidden entries ({ name, hidden: true }) are kept as they are.
//
//   node scripts/order-variants.mjs <component>                → print the current order (Markdown table)
//   node scripts/order-variants.mjs <component> <slug> <slug>… → set the order (every visible variant, once)
//   npm run order:variants -- demo
//   npm run order:variants -- demo basic outlined
//   npm run order:variants -- card --compositions kpi metric-group   → same, for the compositions list
//
// <component> is the ID or the folder (button, demo, _demo_). --compositions orders the `compositions`
// list (version-N/compositions/<slug>/ folders, Compositions tab) instead of `variants`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  findComponent,
  readVariantEntries,
  toPosix,
  variantTitle,
  variantVersions,
  writeVariantEntries,
} from './component-files.mjs';

function fail(message) {
  console.error(`[order-variants] ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
/** Example folder and config list: variants (Variants tab) or compositions (Compositions tab). */
const kind = args.includes('--compositions') ? 'compositions' : 'variants';
const [componentArg, ...order] = args.filter((arg) => arg !== '--compositions');
if (!componentArg) fail('Usage: npm run order:variants -- <component> [--compositions] [<slug> <slug>…]');

const component = findComponent(componentArg);
if (!component) fail(`Component "${componentArg}" not found in src/components/.`);
if (!existsSync(component.config)) fail(`Missing config: ${toPosix(component.config)}`);

const source = readFileSync(component.config, 'utf8');
const entries = readVariantEntries(source, kind)?.entries ?? [];
const folders = variantVersions(component, kind);

/** Visible order, as src/service/component-catalog.ts resolves it. */
function currentOrder() {
  const declared = entries.filter((e) => !e.hidden && folders.has(e.slug)).map((e) => e.slug);
  const detected = [...folders.keys()]
    .filter((slug) => !entries.some((e) => e.slug === slug))
    .sort((a, b) => Number(b === 'basic') - Number(a === 'basic') || a.localeCompare(b));
  return [...new Set(declared), ...detected];
}

function printTable(slugs) {
  const noun = kind === 'compositions' ? 'composition(s)' : 'variant(s)';
  console.log(`\n${component.id} · ${slugs.length} ${noun}\n`);
  console.log('| # | Slug | Title | Versions |');
  console.log('|---|---|---|---|');
  slugs.forEach((slug, i) => {
    const versions = folders.get(slug);
    console.log(`| ${i + 1} | ${slug} | ${variantTitle(component, slug, versions, kind)} | ${versions.join(', ')} |`);
  });
  const hidden = entries.filter((e) => e.hidden).map((e) => e.slug);
  if (hidden.length) console.log(`\nHidden (kept as they are): ${hidden.join(', ')}`);
}

if (!order.length) {
  printTable(currentOrder());
  process.exit(0);
}

// Setting the order: every visible variant exactly once, nothing else.
const visible = currentOrder();
const unknown = order.filter((slug) => !visible.includes(slug));
const missing = visible.filter((slug) => !order.includes(slug));
const repeated = order.filter((slug, i) => order.indexOf(slug) !== i);
if (unknown.length) fail(`Not a visible variant of ${component.id}: ${unknown.join(', ')} (variants: ${visible.join(', ')}).`);
if (missing.length) fail(`Missing in the order: ${missing.join(', ')}. List every variant once.`);
if (repeated.length) fail(`Listed more than once: ${[...new Set(repeated)].join(', ')}.`);

const texts = [
  // An existing object entry ({ name, description }) keeps its text; the rest are written as slugs.
  ...order.map((slug) => entries.find((e) => !e.hidden && e.slug === slug && !e.text.match(/^['"`]/))?.text ?? `'${slug}'`),
  ...entries.filter((e) => e.hidden).map((e) => e.text),
];
const updated = writeVariantEntries(source, texts, kind);
if (updated === source) {
  console.log(`[order-variants] ${toPosix(component.config)} already has this order.`);
} else {
  writeFileSync(component.config, updated);
  console.log(`[order-variants] ${toPosix(component.config)} → ${kind}: ${order.join(', ')}`);
}
// No regeneration needed: the config is a normal import, ng serve reloads it.
printTable(order);
