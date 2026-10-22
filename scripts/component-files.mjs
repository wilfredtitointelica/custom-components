// Helpers shared by order-variants.mjs and remove.mjs: locate a component folder, its version-N/ folders
// and variants/<slug>/ examples, and read/rewrite the `variants` list of its <id>.config.ts (order and
// hidden variants only, see VariantDefinition in src/service/catalog.model.ts). The rest of the config
// file is never touched.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const VERSION_FOLDER = /^version-(\d+)$/;

export const toPosix = (path) => relative(ROOT, path).replace(/\\/g, '/');

/** Same rule as src/service/slug.ts: "Icons + Border" → "icons-border", "RadioButton" → "radio-button". */
export const toSlug = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const subfolders = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

/** Component folder: exact name, or the ID wrapped in underscores (reference folders such as _demo_). */
export function findComponent(component) {
  const dir = subfolders(COMPONENTS_DIR).find(
    (folder) => folder === component || folder.replace(/^_+|_+$/g, '') === component,
  );
  if (!dir) return undefined;
  const id = dir.replace(/^_+|_+$/g, '');
  const versions = subfolders(join(COMPONENTS_DIR, dir))
    .map((folder) => Number(VERSION_FOLDER.exec(folder)?.[1]))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  return {
    dir,
    id,
    path: join(COMPONENTS_DIR, dir),
    config: join(COMPONENTS_DIR, dir, `${id}.config.ts`),
    versions,
  };
}

/** Example folders of one version (variants/<slug>/ with an example.ts, as generate-docs.mjs reads them). */
export const variantSlugs = (component, version) => {
  const variantsDir = join(component.path, `version-${version}`, 'variants');
  return subfolders(variantsDir).filter((slug) => existsSync(join(variantsDir, slug, 'example.ts')));
};

/** slug → versions that have that example folder, for every version of the component. */
export function variantVersions(component) {
  const map = new Map();
  for (const version of component.versions) {
    for (const slug of variantSlugs(component, version)) map.set(slug, [...(map.get(slug) ?? []), version]);
  }
  return map;
}

/** `title:` of the header comment of example.html (latest version that has it). */
export function variantTitle(component, slug, versions) {
  for (const version of [...versions].reverse()) {
    const file = join(component.path, `version-${version}`, 'variants', slug, 'example.html');
    if (!existsSync(file)) continue;
    const title = /<!--[\s\S]*?^\s*title:[ \t]*(.*)$/m.exec(readFileSync(file, 'utf8'))?.[1]?.trim();
    if (title) return title;
  }
  return '';
}

// ─── `variants` list of <id>.config.ts ───────────────────────────────────────────────────────────

/**
 * Entries of `variants: [ … ]` (null when the config has no such list). Each entry keeps its original
 * text, so objects ({ name, hidden: true }) are rewritten exactly as they were.
 */
export function readVariantEntries(source) {
  const key = /^([ \t]*)variants\s*:\s*\[/m.exec(source);
  if (!key) return null;
  const open = key.index + key[0].length - 1;
  const items = [];
  let depth = 0;
  let quote = '';
  let current = '';
  let close = -1;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      current += char;
      if (char === '\\') current += source[++i];
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    if ('[{('.includes(char)) depth++;
    if (']})'.includes(char)) depth--;
    if (depth === 0) {
      close = i;
      break;
    }
    if (depth === 1 && (char === ',' || char === '[')) {
      if (char === ',') items.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (close < 0) throw new Error('Unclosed `variants: [` in the config.');
  items.push(current);

  const entries = items
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => {
      const literal = /^(['"`])(.*)\1$/s.exec(text);
      if (literal) return { text, slug: toSlug(literal[2]), hidden: false };
      const slug = /\bslug\s*:\s*(['"`])(.*?)\1/.exec(text)?.[2];
      const name = /\bname\s*:\s*(['"`])(.*?)\1/.exec(text)?.[2] ?? '';
      return { text, slug: slug ?? toSlug(name), hidden: /\bhidden\s*:\s*true\b/.test(text) };
    });

  // The whole property, from the start of its line to the end of its line (trailing comma included).
  const lineStart = key.index;
  let end = close + 1;
  if (source[end] === ',') end++;
  while (source[end] === ' ' || source[end] === '\t') end++;
  if (source[end] === '\r') end++;
  if (source[end] === '\n') end++;
  return { entries, indent: key[1], start: lineStart, end };
}

/** Rewrites (or inserts after `id:`, or removes when empty) the `variants` list with these entry texts. */
export function writeVariantEntries(source, texts) {
  const current = readVariantEntries(source);
  const indent = current?.indent ?? '  ';
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const inline = `${indent}variants: [${texts.join(', ')}],`;
  const property = !texts.length
    ? ''
    : inline.length <= 100 && !texts.some((text) => text.includes('\n'))
      ? `${inline}${newline}`
      : `${indent}variants: [${newline}${texts.map((text) => `${indent}  ${text},${newline}`).join('')}${indent}],${newline}`;

  if (current) return source.slice(0, current.start) + property + source.slice(current.end);
  if (!property) return source;
  const idLine = /^[ \t]*id\s*:.*\r?\n/m.exec(source);
  if (!idLine) throw new Error('No `id:` line found in the config to insert `variants` after.');
  const at = idLine.index + idLine[0].length;
  return source.slice(0, at) + property + source.slice(at);
}

/** A list of plain slugs already in the default order ("basic" first, then alphabetical) adds nothing. */
export function isDefaultOrder(entries) {
  if (!entries.every((e) => /^['"`]/.test(e.text))) return false;
  const slugs = entries.map((e) => e.slug);
  const sorted = [...slugs].sort((a, b) => Number(b === 'basic') - Number(a === 'basic') || a.localeCompare(b));
  return slugs.every((slug, i) => slug === sorted[i]);
}

/**
 * Sets a one-line top-level property of the config (`hidden: true,`, `hiddenVersions: [1, 2],`):
 * replaces its line, inserts it after `id:` (after `variants` if present), or removes it when value
 * is undefined.
 */
export function setConfigProperty(source, key, value) {
  const line = new RegExp(`^[ \\t]*${key}\\s*:.*\\r?\\n`, 'm');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const property = value === undefined ? '' : `  ${key}: ${value},${newline}`;
  if (line.test(source)) return source.replace(line, property);
  if (!property) return source;
  const variants = readVariantEntries(source);
  if (variants) return source.slice(0, variants.end) + property + source.slice(variants.end);
  const idLine = /^[ \t]*id\s*:.*\r?\n/m.exec(source);
  if (!idLine) throw new Error(`No \`id:\` line found in the config to insert \`${key}\` after.`);
  const at = idLine.index + idLine[0].length;
  return source.slice(0, at) + property + source.slice(at);
}

/** `hiddenVersions: [1, 2]` of the config. */
export const readHiddenVersions = (source) =>
  (/^[ \t]*hiddenVersions\s*:\s*\[([^\]]*)\]/m.exec(source)?.[1] ?? '')
    .split(',')
    .map((n) => Number(n.trim()))
    .filter((n) => n > 0);

/** Regenerates src/generated/ (a running ng serve picks it up). */
export const regenerateDocs = () =>
  spawnSync(process.execPath, [join(ROOT, 'scripts', 'generate-docs.mjs')], { stdio: 'inherit' });
