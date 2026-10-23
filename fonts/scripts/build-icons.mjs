// Builds an icon font from the SVGs of <font>/source/<category>/<icon-name>.svg:
//   <font>/dist/<name>.{css,eot,html,json,svg,ttf,woff,woff2}   (fantasticon + templates/)
//   <font>/icons.json                                           (categories -> icons, with codepoints)
// Codepoints are stable: the previous dist/<name>.json is read first, so an existing icon keeps its
// codepoint and a new one takes the next free codepoint from startCodepoint. Output is deterministic
// (categories and icons in alphabetical order). Nothing in dist/ or icons.json is edited by hand.
//
//   node scripts/build-icons.mjs <font>
//   npm run build:incontrol-icons
//
// <font> is a folder next to this script's parent (incontrol-icons) or any absolute path. It must
// contain icons.config.mjs, source/ and templates/{css,html}.hbs.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { FontAssetType, generateFonts, OtherAssetType } from 'fantasticon';
import Handlebars from 'handlebars';
import { optimize } from 'svgo';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEBAB = '[a-z0-9]+(?:-[a-z0-9]+)*';
const CATEGORY_NAME = new RegExp(`^${KEBAB}$`);
/** A stroke that is not "none": fonts only render fills, so it would be lost. */
const STROKE = /\bstroke\s*[:=]\s*["']?(?!none\b)[#\w]/i;
/** Also the order of @font-face src: browsers take the first format they support. */
const FONT_TYPES = [
  FontAssetType.WOFF2,
  FontAssetType.WOFF,
  FontAssetType.TTF,
  FontAssetType.EOT,
  FontAssetType.SVG,
];

const toPosix = (path) => relative(ROOT, path).replace(/\\/g, '/');
const titleCase = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

function fail(message) {
  console.error(`[build-icons] ${message}`);
  process.exit(1);
}

async function loadConfig(fontDir) {
  const configPath = join(fontDir, 'icons.config.mjs');
  if (!existsSync(configPath)) fail(`Missing ${toPosix(configPath)}.`);
  const { default: config } = await import(pathToFileURL(configPath).href);
  if (!config?.name || !config?.prefix) fail(`${toPosix(configPath)} must export name and prefix.`);
  return { startCodepoint: 0xf101, fontHeight: 1000, normalize: true, categories: {}, ...config };
}

/** source/<category>/<icon>.svg -> [{ slug, category, icons: [{ name, path }] }], validated and sorted. */
function readSource(sourceDir, config) {
  if (!existsSync(sourceDir)) fail(`Missing ${toPosix(sourceDir)}.`);
  const iconName = new RegExp(`^${config.prefix}-${KEBAB}$`);
  const errors = [];
  const seen = new Map();
  const categories = [];

  const entries = readdirSync(sourceDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = join(sourceDir, entry.name);
    if (!entry.isDirectory()) {
      if (entry.name.toLowerCase().endsWith('.svg')) {
        errors.push(`${toPosix(entryPath)}: SVGs must be inside a category folder (source/<category>/).`);
      }
      continue;
    }
    if (!CATEGORY_NAME.test(entry.name)) {
      errors.push(`${toPosix(entryPath)}: category folders are kebab-case (e.g. business-and-finance).`);
      continue;
    }

    const icons = [];
    const files = readdirSync(entryPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const file of files) {
      const filePath = join(entryPath, file.name);
      if (file.isDirectory()) {
        errors.push(`${toPosix(filePath)}: nested folders are not allowed inside a category.`);
        continue;
      }
      if (!file.name.toLowerCase().endsWith('.svg')) continue;
      const name = file.name.slice(0, -4);
      if (!iconName.test(name)) {
        errors.push(`${toPosix(filePath)}: the name must be kebab-case and start with "${config.prefix}-".`);
        continue;
      }
      if (seen.has(name)) {
        errors.push(`${name} is duplicated:\n    - ${toPosix(seen.get(name))}\n    - ${toPosix(filePath)}`);
        continue;
      }
      seen.set(name, filePath);
      icons.push({ name, path: filePath });
    }
    if (icons.length) {
      categories.push({ slug: entry.name, category: config.categories[entry.name] ?? titleCase(entry.name), icons });
    }
  }

  if (errors.length) fail(`Invalid source:\n  ${errors.join('\n  ')}`);
  if (!seen.size) fail(`No SVGs found in ${toPosix(sourceDir)}/<category>/.`);
  return categories;
}

/** Optimized copies of every SVG, flat in a temporary folder (source/ is never modified). */
function prepareSvgs(categories, tempDir) {
  const strokes = [];
  for (const { icons } of categories) {
    for (const { name, path } of icons) {
      const svg = readFileSync(path, 'utf8');
      if (STROKE.test(svg)) strokes.push(toPosix(path));
      const { data } = optimize(svg, { path, multipass: true });
      writeFileSync(join(tempDir, `${name}.svg`), data);
    }
  }
  if (strokes.length) {
    console.warn(
      `[build-icons] Warning: these SVGs use strokes, which an icon font does not render.\n` +
        `  In Figma apply "Outline stroke" and "Flatten" before exporting:\n  - ${strokes.join('\n  - ')}`,
    );
  }
}

/** Keeps the codepoint of every icon already in the previous JSON; new icons take the next free one. */
function assignCodepoints(categories, previousJson, start) {
  let previous = {};
  if (existsSync(previousJson)) {
    try {
      previous = JSON.parse(readFileSync(previousJson, 'utf8'));
    } catch {
      fail(`${toPosix(previousJson)} is not valid JSON; restore it from git before building.`);
    }
  }

  const names = categories.flatMap(({ icons }) => icons.map(({ name }) => name));
  const codepoints = {};
  const used = new Set();
  for (const name of names) {
    if (Number.isInteger(previous[name]) && !used.has(previous[name])) {
      codepoints[name] = previous[name];
      used.add(previous[name]);
    }
  }
  let next = start;
  const added = [];
  for (const name of names) {
    if (codepoints[name] !== undefined) continue;
    while (used.has(next)) next++;
    codepoints[name] = next;
    used.add(next);
    added.push(name);
  }

  // Same order as icons.json, so the CSS and JSON follow the categories.
  const ordered = Object.fromEntries(names.map((name) => [name, codepoints[name]]));
  const removed = Object.keys(previous).filter((name) => !(name in ordered));
  return { codepoints: ordered, added, removed };
}

async function build(fontArg) {
  const fontDir = resolve(ROOT, fontArg);
  const config = await loadConfig(fontDir);
  const sourceDir = join(fontDir, 'source');
  const distDir = join(fontDir, 'dist');
  const templatesDir = join(fontDir, 'templates');

  const categories = readSource(sourceDir, config);
  const { codepoints, added, removed } = assignCodepoints(
    categories,
    join(distDir, `${config.name}.json`),
    config.startCodepoint,
  );

  const tree = {
    name: config.name,
    categories: categories.map(({ category, slug, icons }) => ({
      category,
      slug,
      icons: icons.map(({ name }) => ({ name, code: codepoints[name], unicode: codepoints[name].toString(16) })),
    })),
  };
  const total = Object.keys(codepoints).length;

  // Everything is generated in a temporary folder first: dist/ is only replaced when the build succeeds.
  const tempDir = mkdtempSync(join(tmpdir(), `${config.name}-`));
  const svgDir = join(tempDir, 'svg');
  const outDir = join(tempDir, 'dist');
  try {
    mkdirSync(svgDir);
    mkdirSync(outDir);
    prepareSvgs(categories, svgDir);

    await generateFonts({
      name: config.name,
      prefix: config.prefix,
      inputDir: svgDir,
      outputDir: outDir,
      fontTypes: FONT_TYPES,
      assetTypes: [OtherAssetType.CSS],
      templates: { css: join(templatesDir, 'css.hbs') },
      fontHeight: config.fontHeight,
      normalize: config.normalize,
      codepoints,
      getIconId: ({ basename }) => basename,
    });
    const html = Handlebars.compile(readFileSync(join(templatesDir, 'html.hbs'), 'utf8'));
    writeFileSync(join(outDir, `${config.name}.html`), html({ ...tree, total }));
    writeFileSync(join(outDir, `${config.name}.json`), `${JSON.stringify(codepoints, null, 2)}\n`);

    rmSync(distDir, { recursive: true, force: true });
    cpSync(outDir, distDir, { recursive: true });
    writeFileSync(join(fontDir, 'icons.json'), `${JSON.stringify(tree, null, 2)}\n`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`[build-icons] ${config.name}: ${total} icons in ${tree.categories.length} categories -> ${toPosix(distDir)}`);
  if (added.length) console.log(`  added:   ${added.join(', ')}`);
  if (removed.length) console.log(`  removed: ${removed.join(', ')}`);
}

const [fontArg, ...extra] = process.argv.slice(2);
if (!fontArg || extra.length) fail('Usage: node scripts/build-icons.mjs <font-folder>');
await build(fontArg);
