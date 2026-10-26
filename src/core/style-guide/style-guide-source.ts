import { findStyleGuideStyles } from './style-guide';

/** Source files of the style guide bundle: path (webpack://./src/…) and its original SCSS. */
export interface StyleGuideSource {
  readonly path: string;
  readonly content: string;
}

interface SourceMap {
  readonly sources: readonly string[];
  readonly sourcesContent?: readonly (string | null)[];
}

const SOURCE_MAP = /sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/;
const NOT_A_COLOR = /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i;

/**
 * Original files of the style guide, in bundle order. Read from the source map that style-loader appends to
 * the bundle's <style> (sources + sourcesContent), so tokens and helpers keep the file and the comments they
 * were written with. Null when the bundle is not in the page or carries no source map.
 */
export function readStyleGuideSources(): StyleGuideSource[] | null {
  const encoded = findStyleGuideStyles()
    .map((style) => SOURCE_MAP.exec(style.textContent ?? '')?.[1])
    .find(Boolean);
  if (!encoded) {
    return null;
  }
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const { sources, sourcesContent }: SourceMap = JSON.parse(new TextDecoder().decode(bytes));
  return sources.flatMap((path, index) => {
    const content = sourcesContent?.[index];
    return content ? [{ path, content }] : [];
  });
}

/** Whether a computed value is a color worth a swatch (keywords that depend on context are not). */
export function isColor(value: string): boolean {
  return !!value && !NOT_A_COLOR.test(value) && CSS.supports('color', value);
}
