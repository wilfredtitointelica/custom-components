import { isColor, readStyleGuideSources } from './style-guide-source';

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

const TOKEN_FILE = /\/(_tokens\.([\w.-]+)\.scss)$/;
const DECLARATION = /(--i-[\w-]+)\s*:\s*([^;]*);[ \t]*(?:\/\/[ \t]*([^\n]*))?/g;

/**
 * Tokens --i-* of the style guide, one entry per _tokens.*.scss file, in bundle order, so each token keeps
 * the file it was declared in. Null when the bundle's sources cannot be read (style-guide-source.ts).
 */
export function readStyleTokens(sources = readStyleGuideSources()): TokenFile[] | null {
  if (!sources) {
    return null;
  }
  const root = getComputedStyle(document.documentElement);

  return sources.flatMap(({ path, content }) => {
    const match = TOKEN_FILE.exec(path);
    if (!match) {
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
        color: isColor(resolved),
        note: note.trim(),
      };
    });
}
