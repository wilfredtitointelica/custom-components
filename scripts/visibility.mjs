// Hides or shows again a component, a variant or a version in the documentation site, without
// deleting any code. Only <id>.config.ts changes:
//   component → `hidden: true`                    out of the menu, routes, search, gallery and Status
//   variant   → `{ name: '<slug>', hidden: true }` in `variants` (keeps its position in the list)
//   version   → `hiddenVersions: [N]`             out of the version picker; ?version=N opens the latest
// `list` prints what is hidden now (all components, or one).
//
//   node scripts/visibility.mjs list [<component>]
//   node scripts/visibility.mjs hide|show component <component>
//   node scripts/visibility.mjs hide|show variant <component> <slug>
//   node scripts/visibility.mjs hide|show version <component> <N>
//   npm run visibility -- hide variant accordion raised
//
// <component> is the ID or the folder (button, demo, _demo_). No regeneration needed: the config is a
// normal import, ng serve reloads it.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  COMPONENTS_DIR,
  findComponent,
  isDefaultOrder,
  readHiddenVersions,
  readVariantEntries,
  setConfigProperty,
  toPosix,
  variantTitle,
  variantVersions,
  writeVariantEntries,
} from './component-files.mjs';

const USAGE = [
  'Usage:',
  '  npm run visibility -- list [<component>]',
  '  npm run visibility -- hide|show component <component>',
  '  npm run visibility -- hide|show variant <component> <slug>',
  '  npm run visibility -- hide|show version <component> <N>',
].join('\n');

function fail(message) {
  console.error(`[visibility] ${message}`);
  process.exit(1);
}

const HIDDEN_COMPONENT = /^[ \t]*hidden\s*:\s*true\b/m;
const [action, kind, componentArg, target] = process.argv.slice(2);

/** What is hidden in one component: { component, variants: [slug], versions: [N] }. */
function hiddenIn(component) {
  if (!existsSync(component.config)) return { component: false, variants: [], versions: [] };
  const source = readFileSync(component.config, 'utf8');
  return {
    component: HIDDEN_COMPONENT.test(source),
    variants: (readVariantEntries(source)?.entries ?? []).filter((e) => e.hidden).map((e) => e.slug),
    versions: readHiddenVersions(source),
  };
}

// ─── list ────────────────────────────────────────────────────────────────────────────────────────

if (action === 'list') {
  const components = kind
    ? [findComponent(kind) ?? fail(`Component "${kind}" not found in src/components/.`)]
    : readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => findComponent(entry.name));
  const rows = components.flatMap((component) => {
    const hidden = hiddenIn(component);
    const folders = variantVersions(component);
    return [
      ...(hidden.component ? [`| Component | ${component.id} | — |`] : []),
      ...hidden.versions.map((n) => `| Version | ${component.id} | version ${n} |`),
      ...hidden.variants.map((slug) => {
        const title = folders.has(slug) ? variantTitle(component, slug, folders.get(slug)) : '(no folder)';
        return `| Variant | ${component.id} | ${slug} · ${title} |`;
      }),
    ];
  });
  if (!rows.length) console.log(`[visibility] Nothing hidden${kind ? ` in ${kind}` : ''}.`);
  else console.log(['| Type | Component | Item |', '|---|---|---|', ...rows].join('\n'));
  process.exit(0);
}

// ─── hide / show ─────────────────────────────────────────────────────────────────────────────────

if (!['hide', 'show'].includes(action) || !['component', 'variant', 'version'].includes(kind) || !componentArg) {
  fail(USAGE);
}
const hide = action === 'hide';
const component = findComponent(componentArg);
if (!component) fail(`Component "${componentArg}" not found in src/components/.`);
if (!existsSync(component.config)) fail(`Missing config: ${toPosix(component.config)}`);
const source = readFileSync(component.config, 'utf8');
let updated = source;
let what;

if (kind === 'component') {
  what = component.id;
  if (HIDDEN_COMPONENT.test(source) === hide) fail(`${what} is already ${hide ? 'hidden' : 'visible'}.`);
  updated = setConfigProperty(source, 'hidden', hide ? 'true' : undefined);
}

if (kind === 'variant') {
  const slug = target;
  if (!slug) fail(USAGE);
  const folders = variantVersions(component);
  if (!folders.has(slug)) fail(`Variant "${slug}" not found in ${component.id} (variants: ${[...folders.keys()].join(', ')}).`);
  what = `${component.id} › ${slug}`;
  const entries = readVariantEntries(source)?.entries ?? [];
  const entry = entries.find((e) => e.slug === slug);
  if (Boolean(entry?.hidden) === hide) fail(`${what} is already ${hide ? 'hidden' : 'visible'}.`);

  let texts;
  if (hide) {
    const hidden = `{ name: '${slug}', hidden: true }`;
    texts = entry
      ? entries.map((e) =>
          e !== entry
            ? e.text
            : /^['"`]/.test(e.text)
              ? hidden
              : e.text.replace(/\s*\}$/, ', hidden: true }').replace(/,\s*,/, ','),
        )
      : [...entries.map((e) => e.text), hidden];
  } else {
    // A bare { name: '<slug>', hidden: true } goes back to a plain slug; richer objects lose `hidden` only.
    const shown = entries.map((e) => {
      if (e !== entry) return e;
      const text = /^\{\s*name\s*:\s*(['"`])[^'"`]*\1\s*,\s*hidden\s*:\s*true\s*,?\s*\}$/.test(e.text)
        ? `'${slug}'`
        : e.text.replace(/,?\s*hidden\s*:\s*true\s*/, ' ').replace(/\s+\}$/, ' }');
      return { ...e, text, hidden: false };
    });
    texts = isDefaultOrder(shown) ? [] : shown.map((e) => e.text);
  }
  updated = writeVariantEntries(source, texts);
}

if (kind === 'version') {
  const number = Number(target);
  if (!(number > 0)) fail(USAGE);
  if (!component.versions.includes(number)) {
    fail(`${component.dir}/version-${number}/ does not exist (versions: ${component.versions.join(', ')}).`);
  }
  what = `${component.id} › version ${number}`;
  const hidden = readHiddenVersions(source);
  if (hidden.includes(number) === hide) fail(`${what} is already ${hide ? 'hidden' : 'visible'}.`);
  const next = hide ? [...hidden, number].sort((a, b) => a - b) : hidden.filter((n) => n !== number);
  if (component.versions.every((n) => next.includes(n))) {
    fail(`version ${number} is the last visible version of ${component.id}: hide the component instead.`);
  }
  updated = setConfigProperty(source, 'hiddenVersions', next.length ? `[${next.join(', ')}]` : undefined);
}

writeFileSync(component.config, updated);
console.log(`[visibility] ${what} → ${hide ? 'hidden' : 'visible'} (${toPosix(component.config)})`);
