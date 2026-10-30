// Checks that a component follows the conventions of the repo, so replicar-primeng, sincronizar-componente and
// resolver-dependencias can work on it: folder structure, base class, BEM classes, --int-* → --i-* tokens
// with their origin comment, motion and focus rules, and dep:<id> provisional markers vs requires / uses.
// Same rules as phase 4 of .claude/skills/replicar-primeng/SKILL.md, in code instead of greps.
//
//   node scripts/check-component.mjs <component> [--version <N>]
//   node scripts/check-component.mjs --all
//   npm run check:component -- card
//   npm run check:component -- --all
//
// <component> is the ID or the folder. Without --version, every version-N is checked. --all checks every
// component except reference folders (_demo_). Errors (❌) exit with code 1; warnings (⚠️) do not.
// A component still in template state passes. Tokens and u-* helpers are looked up in the Intelica Style
// Guide (INTELICA_STYLE_GUIDE, default below); without it those checks become warnings.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { COMPONENTS_DIR, findComponent, toPosix } from './component-files.mjs';

const STYLE_GUIDE =
  process.env.INTELICA_STYLE_GUIDE ??
  'C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css';

/** Values a --int-* token may hold without a var(--i-*): they are not design tokens (SKILL.md 3.3). */
const TOKEN_EXCEPTIONS = new Set(['0', '50%', 'currentColor', 'inherit', 'transparent']);
const ORIGIN_COMMENT = /\/\/.*\b(knowledgeBase|SG|Figma|Aura):/;
const LITERAL_DURATION = /\b([1-9]\d*|0?\.\d+)m?s\b/;

function fail(message) {
  console.error(`[check-component] ${message}`);
  process.exit(1);
}

const toPascal = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      })
    : [];

/** Removes /* *\/ and // comments, keeping line breaks so line numbers still match. */
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ''))
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1');

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** Style Guide lookups, loaded once: defined --i-* tokens and .u-* helpers. */
const styleGuide = (() => {
  if (!existsSync(STYLE_GUIDE)) return undefined;
  const tokens = new Set();
  // Tokens live in tokens/ and also in the component modules (--i-card-gap in components/card/).
  for (const file of walk(STYLE_GUIDE).filter((path) => /\.s?css$/.test(path))) {
    for (const match of readFileSync(file, 'utf8').matchAll(/(--i-[\w-]+)\s*:/g))
      tokens.add(match[1]);
  }
  const helpersFile = join(STYLE_GUIDE, 'utilities', '_helpers.scss');
  const helpers = new Set();
  if (existsSync(helpersFile)) {
    for (const match of readFileSync(helpersFile, 'utf8').matchAll(/\.(u-[\w-]+)/g))
      helpers.add(match[1]);
  }
  return { tokens, helpers };
})();

const readList = (config, key) =>
  [
    ...(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`).exec(config)?.[1] ?? '').matchAll(
      /['"]([\w-]+)['"]/g,
    ),
  ].map((match) => match[1]);

function checkVersion(component, version, report, deps) {
  const { id } = component;
  const root = join(component.path, `version-${version}`);
  const files = walk(root);
  const rel = (path) => toPosix(path);
  const inBase = (path) => path.includes(`${join(root, 'base')}`);
  const inVariants = (path) => path.includes(`${join(root, 'variants')}`);

  // --- structure ---
  const required = [
    `base/${id}.ts`,
    `base/${id}.html`,
    'styles/_index.scss',
    `styles/_${id}.scss`,
    'variants/basic/example.ts',
  ];
  for (const path of required) {
    if (!existsSync(join(root, path))) report.error(rel(join(root, path)), 'missing file');
  }
  for (const file of files) {
    const name = basename(file);
    if (/\.component\.(ts|html|s?css)$/.test(name) || name.startsWith('int-'))
      report.error(
        rel(file),
        `file name: use base/${id}.ts + base/${id}.html (no .component / int- prefix)`,
      );
    if (name.endsWith('.css')) report.error(rel(file), 'use .scss, not .css');
  }
  if (existsSync(join(root, 'variants', 'default')))
    report.error(
      rel(join(root, 'variants', 'default')),
      'use variants/basic/, not variants/default/',
    );

  const index = join(root, 'styles', '_index.scss');
  if (existsSync(index)) {
    for (const match of stripComments(readFileSync(index, 'utf8')).matchAll(
      /@use\s+['"]([^'"]+)['"]/g,
    )) {
      if (!existsSync(join(root, 'styles', `_${match[1]}.scss`)))
        report.warn(rel(index), `@use '${match[1]}' points to a missing file`);
    }
  }

  // --- base class ---
  const baseTs = join(root, 'base', `${id}.ts`);
  if (existsSync(baseTs)) {
    const source = readFileSync(baseTs, 'utf8');
    if (!new RegExp(`selector:\\s*['"]int-${id}['"]`).test(source))
      report.error(rel(baseTs), `selector must be 'int-${id}'`);
    const body = /export class (\w+)[^{]*\{([\s\S]*)/.exec(source);
    if (body?.[1] !== `Int${toPascal(id)}`)
      report.error(rel(baseTs), `class must be Int${toPascal(id)}`);
    const members = stripComments(body?.[2] ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (
      !/^static readonly status\b/.test(members[0] ?? '') ||
      !/^static readonly designer\b/.test(members[1] ?? '')
    )
      report.error(rel(baseTs), 'the first two class members must be static status and designer');
  }

  // --- HTML header ---
  const baseHtml = join(root, 'base', `${id}.html`);
  let header = '';
  if (existsSync(baseHtml)) {
    header = /^\s*<!--([\s\S]*?)-->/.exec(readFileSync(baseHtml, 'utf8'))?.[1] ?? '';
    for (const key of ['title', 'description'])
      if (!new RegExp(`^\\s*${key}:`, 'm').test(header))
        report.error(rel(baseHtml), `header without "${key}:"`);
  }

  // --- per file ---
  const styles = files.filter((file) => file.endsWith('.scss'));
  const allStyles = styles.map((file) => readFileSync(file, 'utf8')).join('\n');
  let animates = false;

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const path = rel(file);

    if (file.endsWith('.ts')) {
      if (/from\s+['"](primeng|@primeuix)/.test(source))
        report.error(path, 'imports PrimeNG (primeng / @primeuix)');
      if (/from\s+['"]@angular\/animations/.test(source))
        report.error(path, 'imports @angular/animations: use animate.enter / animate.leave + CSS');
      if (/:\s*any\b|<any>|\bas any\b|as unknown as/.test(stripComments(source)))
        report.error(path, 'uses any / as unknown as');
      if (inBase(file) && /from\s+['"][^'"]*\/(core|service|variants)\//.test(source))
        report.error(
          path,
          'the base imports core/, service/ or variants/ (it is extracted to npm alone)',
        );
      for (const match of source.matchAll(
        /from\s+['"](?:\.\.\/){3}([\w-]+)\/version-\d+\/base\//g,
      )) {
        const dep = match[1];
        if (inBase(file) && !deps.requires.includes(dep))
          report.error(path, `imports int-${dep} but "${dep}" is not in requires`);
        if (inVariants(file) && !deps.requires.includes(dep) && !deps.uses.includes(dep))
          report.error(path, `imports int-${dep} but "${dep}" is not in requires / uses`);
      }
    }

    // No PrimeNG traces: demo images, logos or any asset served by PrimeFaces.
    for (const match of source.matchAll(/https?:\/\/[^\s"'`)]*(primefaces|primeng)[^\s"'`)]*/gi))
      report.error(
        `${path}:${lineOf(source, match.index)}`,
        `PrimeNG asset "${match[0]}": use a Style Guide placeholder (u-background-* + pi icon)`,
      );

    if (file.endsWith('.html')) {
      const markup = source.replace(/<!--[\s\S]*?-->/g, (block) => block.replace(/[^\n]/g, ' '));
      if (/<p-[a-z]/.test(markup)) report.error(path, 'uses <p-*> PrimeNG components');
      const header = source.match(/^\s*<!--([\s\S]*?)-->/)?.[1] ?? '';
      if (inVariants(file) && /\b(title|description):.*primeng/i.test(header))
        report.warn(path, 'the variant title/description mentions PrimeNG: describe the use case');
      if (inVariants(file) && /\sstyle="|\[style\./.test(markup))
        report.error(path, 'inline style in a variant: use u-* helpers');
      if (/animate\.(enter|leave)/.test(markup)) animates = true;
      // State and a11y belong to the component (an input + host bindings), not to whoever uses it.
      if (inVariants(file))
        for (const tag of markup.matchAll(/<int-[a-z-]+\b[^>]*>/g)) {
          const wiring = tag[0].match(
            /\[attr\.(aria-[a-z]+|tabindex)\]|\srole="|\(keydown\.[a-z]+\)/g,
          );
          if (wiring)
            report.warn(
              `${path}:${lineOf(markup, tag.index)}`,
              `${[...new Set(wiring.map((w) => w.trim().replace(/="$/, '')))].join(', ')} on <int-*>: add an input (e.g. disabled) and handle it inside the component`,
            );
          // A clipped <int-*> cuts the overlays opened inside it (select, datepicker, popover…).
          if (/\sclass="[^"]*\bu-overflow-/.test(tag[0]))
            report.warn(
              `${path}:${lineOf(markup, tag.index)}`,
              'u-overflow-* on <int-*>: clip the inner element in the component SCSS (e.g. __header), not the block',
            );
        }
      for (const match of markup.matchAll(/\sclass="([^"]*)"/g)) {
        // Interpolated parts ({{ item.icon }}) are data, not class names.
        const names = match[1]
          .replace(/\{\{[\s\S]*?\}\}/g, ' ')
          .split(/\s+/)
          .filter(Boolean);
        for (const name of names) {
          const line = lineOf(markup, match.index);
          if (/^p-[a-z]/.test(name)) report.error(`${path}:${line}`, `PrimeNG class "${name}"`);
          else if (/^(pr|pt|ly|gr)[A-Z]/.test(name) || /^(row|col(-[\w]+)*)$/.test(name))
            report.error(
              `${path}:${line}`,
              `Style Guide class "${name}": only --i-* tokens and u-* helpers`,
            );
          else if (/^doc-/.test(name))
            report.error(`${path}:${line}`, `documentation class "${name}"`);
          else if (name.startsWith('u-')) {
            if (inBase(file))
              report.error(`${path}:${line}`, `helper "${name}" in the base: use BEM + tokens`);
            else if (styleGuide && !styleGuide.helpers.has(name))
              report.error(`${path}:${line}`, `helper "${name}" does not exist in the Style Guide`);
          // Icon fonts: primeicons (pi pi-*) and the Style Guide incontrol-icons (icon icon-*).
          } else if (!/^(int-|sk-|pi$|pi-|icon$|icon-)/.test(name))
            report.warn(
              `${path}:${line}`,
              `loose class "${name}": use int-${id}__<element> / --<modifier>`,
            );
        }
      }
    }

    if (file.endsWith('.scss')) {
      const code = stripComments(source);
      const lines = code.split('\n');
      lines.forEach((text, i) => {
        const at = `${path}:${i + 1}`;
        if (/::ng-deep/.test(text)) report.error(at, '::ng-deep');
        if (/--doc-|\.doc-/.test(text))
          report.error(at, 'documentation token or class (--doc-* / .doc-*)');
        if (/\.p-[a-z]/.test(text)) report.error(at, 'PrimeNG selector .p-*');
        if (/\.(pr|pt|ly|gr)[A-Z]/.test(text))
          report.error(at, 'Style Guide class (.pr* / .pt* / .ly* / .gr*)');
        // Selectors only (text before "{", or a line of a selector list): class names outside the block.
        const selector = text.includes('{') ? text.split('{')[0] : /,\s*$/.test(text) ? text : '';
        if (selector && !selector.includes(':root')) {
          for (const match of selector.matchAll(/\.(-?[a-zA-Z][\w-]*)/g)) {
            if (!/^(int-|sk-|u-)/.test(match[1]))
              report.warn(at, `loose class ".${match[1]}": use the int-${id} BEM block`);
          }
        }
      });

      // Motion: whole declarations, since a transition list can span several lines.
      for (const match of code.matchAll(
        /(^|[\s;{])(transition|animation)(-duration)?\s*:([^;{}]*)[;}]/g,
      )) {
        const at = `${path}:${lineOf(code, match.index + match[1].length)}`;
        animates = true;
        if (/^\s*all\b/.test(match[4]) && match[2] === 'transition')
          report.error(at, 'transition: all: list the properties');
        if (LITERAL_DURATION.test(match[4].replace(/var\([^)]*\)/g, '')))
          report.error(at, 'literal duration: use --i-motion-duration-*');
      }
      if (/@keyframes/.test(code)) animates = true;

      // Tokens: every --int-* is an alias of a --i-* and documents where its value comes from.
      source.split('\n').forEach((text, i) => {
        const token = /^\s*(--int-[\w-]+)\s*:\s*([^;]+);/.exec(text);
        if (!token) return;
        const [, name, value] = token;
        const at = `${path}:${i + 1}`;
        const valid =
          /var\(--(i|int)-/.test(value) && !/#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(value)
            ? true
            : TOKEN_EXCEPTIONS.has(value.trim());
        if (!valid) report.error(at, `${name}: ${value.trim()} must be var(--i-*)`);
        if (!ORIGIN_COMMENT.test(text))
          report.warn(at, `${name} without origin comment (// knowledgeBase: · Figma: · Aura:)`);
      });
      for (const match of code.matchAll(/var\((--i-[\w-]+)/g)) {
        if (styleGuide && !styleGuide.tokens.has(match[1]))
          report.error(
            `${path}:${lineOf(code, match.index)}`,
            `${match[1]} does not exist in the Style Guide`,
          );
      }
    }

    // dep:<x> provisional markers: closed, with data-dep, and declared where they live.
    for (const match of source.matchAll(/dep:([\w-]+) provisional/g)) {
      const dep = match[1];
      const at = `${path}:${lineOf(source, match.index)}`;
      if (inBase(file) && !deps.requires.includes(dep))
        report.error(at, `provisional dep:${dep} in the base but "${dep}" is not in requires`);
      if (inVariants(file) && !deps.uses.includes(dep) && !deps.requires.includes(dep))
        report.error(at, `provisional dep:${dep} in a variant but "${dep}" is not in uses`);
      if (file.endsWith('.html') && source.slice(match.index - 10, match.index).includes('<!--')) {
        const end = source.indexOf(`<!-- /dep:${dep} -->`, match.index);
        if (end < 0) report.error(at, `dep:${dep} block without its closing <!-- /dep:${dep} -->`);
        else if (!source.slice(match.index, end).includes(`data-dep="${dep}"`))
          report.error(at, `dep:${dep} block without data-dep="${dep}"`);
      }
    }
  }

  // --- motion and focus, across the version styles ---
  const stylesCode = stripComments(allStyles);
  if (/outline\s*:\s*(none|0)\s*;/.test(stylesCode) && !/:focus-visible/.test(stylesCode))
    report.error(rel(join(root, 'styles')), 'outline: none without a :focus-visible style');
  if (animates && !/prefers-reduced-motion/.test(stylesCode))
    report.warn(
      rel(join(root, 'styles')),
      'animates but has no @media (prefers-reduced-motion: reduce)',
    );
  if (/\/\/\s*.*Figma:\s*[^—\s]/.test(allStyles) && !/^\s*figma:\s*\S+/m.test(header))
    report.warn(rel(baseHtml), 'tokens carry // Figma: values but the header has no figma: link');
}

function checkComponent(component) {
  const findings = [];
  const report = {
    error: (where, message) => findings.push({ level: 'error', where, message }),
    warn: (where, message) => findings.push({ level: 'warn', where, message }),
  };

  const config = existsSync(component.config) ? readFileSync(component.config, 'utf8') : '';
  const deps = { requires: readList(config, 'requires'), uses: readList(config, 'uses') };
  for (const dep of new Set([...deps.requires, ...deps.uses])) {
    if (!existsSync(join(COMPONENTS_DIR, dep)))
      report.warn(
        toPosix(component.config),
        `"${dep}" in requires / uses has no folder in src/components/`,
      );
    if (deps.requires.includes(dep) && deps.uses.includes(dep))
      report.warn(
        toPosix(component.config),
        `"${dep}" is in requires and uses: keep only requires`,
      );
  }

  const versions = values.version ? [Number(values.version)] : component.versions;
  for (const version of versions) {
    if (!component.versions.includes(version)) fail(`${component.id} has no version-${version}`);
    checkVersion(component, version, report, deps);
  }
  return findings;
}

// --- CLI ---
const args = process.argv.slice(2);
const values = { all: args.includes('--all'), version: undefined };
const versionAt = args.indexOf('--version');
if (versionAt >= 0) values.version = args[versionAt + 1];
const name = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--version');

if (!values.all && !name)
  fail('usage: npm run check:component -- <component> [--version <N>] | --all');

const components = values.all
  ? readdirSync(COMPONENTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
      .map((entry) => findComponent(entry.name))
  : [findComponent(name) ?? fail(`component "${name}" not found in src/components/`)];

if (!styleGuide)
  console.warn(
    `[check-component] ⚠️  Style Guide not found at ${STYLE_GUIDE}: --i-* and u-* not verified`,
  );

let errors = 0;
let warnings = 0;
for (const component of components) {
  const findings = checkComponent(component);
  const componentErrors = findings.filter((f) => f.level === 'error').length;
  errors += componentErrors;
  warnings += findings.length - componentErrors;
  if (!findings.length) {
    if (!values.all) console.log(`[check-component] ✅ ${component.id}`);
    continue;
  }
  console.log(
    `\n[check-component] ${component.id}: ${componentErrors} error(s), ${findings.length - componentErrors} warning(s)`,
  );
  for (const f of findings)
    console.log(`  ${f.level === 'error' ? '❌' : '⚠️ '} ${f.where} · ${f.message}`);
}

console.log(
  `\n[check-component] ${components.length} component(s) · ${errors} error(s) · ${warnings} warning(s)`,
);
process.exit(errors ? 1 : 0);
