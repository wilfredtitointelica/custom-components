import { findStyleGuideStyles } from './style-guide';

/**
 * Where a token file sits in the Style Guide dialog: Figma tokens (main), hand-written ones that complement
 * them (custom: each file declares itself "Custom … Tokens"), drafts.
 */
export type TokenGroup = 'main' | 'custom' | 'draft';

export interface StyleToken {
  readonly name: string;
  /** Value as written in the source (var() references kept). */
  readonly value: string;
  /** Value the page computes on :root ('' if it does not resolve). */
  readonly resolved: string;
  readonly color: boolean;
  /** Trailing `// comment` of the declaration. */
  readonly note: string;
}

export interface TokenFile {
  /** Slug of the file name: _tokens.control.draft.scss → control-draft. */
  readonly id: string;
  readonly file: string;
  readonly title: string;
  readonly group: TokenGroup;
  readonly tokens: readonly StyleToken[];
}

interface SourceMap {
  readonly sources: readonly string[];
  readonly sourcesContent?: readonly (string | null)[];
}

const SOURCE_MAP = /sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/;
const TOKEN_FILE = /\/(_tokens\.([\w.-]+)\.scss)$/;
const DECLARATION = /(--i-[\w-]+)\s*:\s*([^;]*);[ \t]*(?:\/\/[ \t]*([^\n]*))?/g;
const NOT_A_COLOR = /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i;

/**
 * Tokens --i-* of the style guide, one entry per _tokens.*.scss file, in bundle order. Read from the source
 * map that style-loader appends to the bundle's <style> (sources + sourcesContent), so each token keeps the
 * file it was declared in. Null when the bundle is not in the page or carries no source map.
 */
export function readStyleTokens(): TokenFile[] | null {
  const map = findStyleGuideStyles()
    .map((style) => SOURCE_MAP.exec(style.textContent ?? '')?.[1])
    .find(Boolean);
  if (!map) {
    return null;
  }
  const { sources, sourcesContent } = decode(map);
  const root = getComputedStyle(document.documentElement);

  return sources.flatMap((source, index) => {
    const match = TOKEN_FILE.exec(source);
    const content = sourcesContent?.[index];
    if (!match || !content) {
      return [];
    }
    const [, file, slug] = match;
    return [
      {
        id: slug.replace(/\./g, '-'),
        file,
        title: slug.replace(/\./g, ' '),
        group: slug === 'figma' ? 'main' : slug.endsWith('.draft') ? 'draft' : 'custom',
        tokens: parseTokens(content, root),
      } satisfies TokenFile,
    ];
  });
}

function decode(base64: string): SourceMap {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function parseTokens(scss: string, root: CSSStyleDeclaration): StyleToken[] {
  // Block comments and whole-line `//` comments go first; a trailing `//` after `;` is kept as the note.
  const code = scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  return [...code.matchAll(DECLARATION)]
    .filter(([, name]) => !name.includes('NOTE'))
    .map(([, name, raw, note = '']) => {
      const value = raw.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();
      const resolved = root.getPropertyValue(name).trim();
      return {
        name,
        value,
        resolved,
        color: !!resolved && !NOT_A_COLOR.test(resolved) && CSS.supports('color', resolved),
        note: note.trim(),
      };
    });
}
