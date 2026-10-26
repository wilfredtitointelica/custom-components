import { isColor, readStyleGuideSources, StyleGuideSource } from './style-guide-source';

/** Piece of a code line of a helper block, as the dialog draws it. */
export type HelperPart =
  | { readonly kind: 'text'; readonly text: string }
  /** Class the block defines (copies `name`; shows `text`, e.g. `&--large` for u-divider-horizontal--large). */
  | { readonly kind: 'class'; readonly name: string; readonly text: string }
  | { readonly kind: 'important' }
  | { readonly kind: 'swatch'; readonly color: string };

export interface HelperLine {
  /** 0 = selector and closing brace; 1+ = inside the braces (faded in the dialog). */
  readonly depth: number;
  readonly parts: readonly HelperPart[];
}

/** One rule block of _helpers.scss, reformatted one statement per line. */
export interface HelperRule {
  /** Classes the block defines, for search and the copied state (nested `&--x` ones included). */
  readonly classes: readonly string[];
  readonly lines: readonly HelperLine[];
}

export interface HelperCategory {
  readonly id: string;
  /** From the section comment: "HELPERS TEXT SIZING" → "Helpers Text Sizing". */
  readonly title: string;
  readonly rules: readonly HelperRule[];
}

const HELPERS_FILE = /\/_helpers(\.[\w.-]+)?\.scss$/;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
/** Title line of a section comment: `/*——*\ ⏎ * HELPERS COLORS ⏎ \*——*\/`. */
const CATEGORY_TITLE = /^\s*\*\s*(HELPERS\b.*)$/m;
const CLASS = /\.(-?[_a-zA-Z][\w-]*)/g;
/** Nested rule that makes a new class from the parent one: `&--large`, `&-x`. */
const DERIVED_CLASS = /^&([-_][\w-]*)/;
const DECLARATION = /^([\w-]+)\s*:\s*(.*?)(\s*!important)?;$/;
const COLOR_PROPERTY = /^(color|background(-color)?|border(-(top|right|bottom|left))?-color|outline-color|fill|stroke|accent-color|caret-color)$/;

/**
 * Helper classes of the style guide (utilities/_helpers.scss), grouped by the section comments of the file,
 * in source order. Null when the bundle's sources cannot be read (style-guide-source.ts).
 */
export function readStyleHelpers(sources = readStyleGuideSources()): HelperCategory[] | null {
  if (!sources) {
    return null;
  }
  const root = getComputedStyle(document.documentElement);
  return sources.filter(({ path }) => HELPERS_FILE.test(path)).flatMap((source) => parseCategories(source, root));
}

function parseCategories({ content }: StyleGuideSource, root: CSSStyleDeclaration): HelperCategory[] {
  const scss = content.replace(/\r/g, '');
  const headings = [...scss.matchAll(BLOCK_COMMENT)].flatMap((comment) => {
    const title = CATEGORY_TITLE.exec(comment[0])?.[1];
    return title ? [{ title, index: comment.index!, end: comment.index! + comment[0].length }] : [];
  });
  // Rules before the first section comment (if any) go to a category of their own.
  const sections = [{ title: 'HELPERS', end: 0 }, ...headings];
  return sections
    .map((section, i) => {
      const start = section.end;
      const end = headings[i]?.index ?? scss.length;
      const title = titleCase(section.title);
      return { id: slug(title), title, rules: parseRules(scss.slice(start, end), root) };
    })
    .filter((category) => category.rules.length);
}

/** Top-level `selector { … }` blocks of a section; comments are left out. */
function parseRules(scss: string, root: CSSStyleDeclaration): HelperRule[] {
  const code = scss.replace(BLOCK_COMMENT, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const rules: HelperRule[] = [];
  let depth = 0;
  let selector = '';
  let body = '';
  for (const char of code) {
    if (depth === 0) {
      if (char === '{') {
        depth = 1;
        body = '';
      } else {
        selector += char;
      }
      continue;
    }
    if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      rules.push(buildRule(selector, body, root));
      selector = '';
      continue;
    }
    body += char;
  }
  return rules;
}

function buildRule(selectorText: string, body: string, root: CSSStyleDeclaration): HelperRule {
  const selectors = selectorText
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const classes = new Set<string>();
  const base = selectors.length === 1 ? [...selectors[0].matchAll(CLASS)][0]?.[1] : undefined;

  const head: HelperLine[] = selectors.map((s, i) => ({
    depth: 0,
    parts: [...classParts(s, classes), { kind: 'text', text: i < selectors.length - 1 ? ',' : ' {' }],
  }));
  const inner = statements(body).map(({ text, depth }) => ({ depth, parts: lineParts(text, base, classes, root) }));
  return { classes: [...classes], lines: [...head, ...inner, { depth: 0, parts: [{ kind: 'text', text: '}' }] }] };
}

/** Body split one statement per line (`decl;`, `nested {`, `}`), with its nesting depth. */
function statements(body: string): { text: string; depth: number }[] {
  const lines: { text: string; depth: number }[] = [];
  let depth = 1;
  let buffer = '';
  const push = (text: string) => text && lines.push({ text, depth });
  for (const char of body) {
    if (char === '{') {
      push(`${clean(buffer)} {`);
      depth++;
      buffer = '';
    } else if (char === '}') {
      push(clean(buffer));
      depth--;
      push('}');
      buffer = '';
    } else if (char === ';') {
      push(`${clean(buffer)};`);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  push(clean(buffer));
  return lines;
}

function lineParts(text: string, base: string | undefined, classes: Set<string>, root: CSSStyleDeclaration): HelperPart[] {
  const derived = DERIVED_CLASS.exec(text);
  if (derived && base) {
    const name = base + derived[1];
    classes.add(name);
    return [{ kind: 'class', name, text: derived[0] }, { kind: 'text', text: text.slice(derived[0].length) }];
  }
  const declaration = DECLARATION.exec(text);
  if (!declaration) {
    return importantParts(text);
  }
  const [, property, value, important] = declaration;
  const color = COLOR_PROPERTY.test(property) ? resolveColor(value, root) : null;
  return [
    { kind: 'text', text: `${property}: ` },
    ...(color ? [{ kind: 'swatch', color } as const] : []),
    { kind: 'text', text: value },
    ...(important ? [{ kind: 'text', text: ' ' } as const, { kind: 'important' } as const] : []),
    { kind: 'text', text: ';' },
  ];
}

function classParts(selector: string, classes: Set<string>): HelperPart[] {
  const parts: HelperPart[] = [];
  let last = 0;
  for (const match of selector.matchAll(CLASS)) {
    if (match.index! > last) {
      parts.push({ kind: 'text', text: selector.slice(last, match.index) });
    }
    classes.add(match[1]);
    parts.push({ kind: 'class', name: match[1], text: match[0] });
    last = match.index! + match[0].length;
  }
  if (last < selector.length) {
    parts.push({ kind: 'text', text: selector.slice(last) });
  }
  return parts;
}

function importantParts(text: string): HelperPart[] {
  return text
    .split(/(!important)/)
    .filter(Boolean)
    .map((piece) => (piece === '!important' ? { kind: 'important' } : { kind: 'text', text: piece }));
}

/** Value with its var() references replaced by what :root computes; null if it is not a color. */
function resolveColor(value: string, root: CSSStyleDeclaration): string | null {
  let resolved = value;
  for (let i = 0; i < 5 && resolved.includes('var('); i++) {
    resolved = resolved.replace(/var\((--[\w-]+)\)/g, (_, name: string) => root.getPropertyValue(name).trim() || '?');
  }
  return isColor(resolved) ? resolved : null;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function titleCase(text: string): string {
  return clean(text)
    .toLowerCase()
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/(^|[\s(])\p{L}/gu, (letter) => letter.toUpperCase());
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
