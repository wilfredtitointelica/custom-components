/**
 * Bridge between the SCSS tokens of the int-* charts and ECharts.
 *
 * ECharts paints SVG from a JS option object and cannot read CSS custom properties, so the chart bases
 * read their own `--int-<id>-*` tokens (which point to the common `--int-graph-*` tokens of
 * src/components/_tokens_/_tokens.graph.scss) with getComputedStyle and build the option from those
 * values. No color, font or size is written in the TypeScript of a chart.
 */

/** Named colors of the chart palette: brands and the categorical palette (`--int-<id>-color-<name>`). */
export type IntGraphColor =
  'mastercard' | 'visa' | 'amex' | 'neutral' | '1' | '2' | '3' | '4' | '5' | '6';

/** Palette names in the order they are given to datasets without a color. */
export const INT_GRAPH_PALETTE: readonly IntGraphColor[] = ['1', '2', '3', '4', '5', '6'];

const NAMED_COLORS = new Set<string>([
  'mastercard',
  'visa',
  'amex',
  'neutral',
  ...INT_GRAPH_PALETTE,
]);

/** Reads `--<prefix>-<key>` from the host for each key (custom properties come with var() already resolved). */
export function readCssTokens<K extends string>(
  host: Element,
  prefix: string,
  keys: readonly K[],
): Record<K, string> {
  const style = getComputedStyle(host);
  const tokens = {} as Record<K, string>;
  for (const key of keys) tokens[key] = style.getPropertyValue(`--${prefix}-${key}`).trim();
  return tokens;
}

/** Converts a CSS length (`12px`, `0.75rem`, `1em`, `12`) to px for ECharts; `fallback` if it cannot. */
export function cssLength(value: string, fallback = 0): number {
  const match = /^(-?[\d.]+)\s*(px|rem|em)?$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (match[2] === 'rem' || match[2] === 'em')
    return amount * parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
  return amount;
}

/** Converts a CSS time (`300ms`, `0.3s`) to milliseconds; `fallback` if it cannot. */
export function cssTime(value: string, fallback = 0): number {
  const match = /^(-?[\d.]+)\s*(ms|s)$/.exec(value.trim());
  if (!match) return fallback;
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
}

/** Converts a CSS number (`0.4`, `700`) for ECharts; `fallback` if it cannot. */
export function cssNumber(value: string, fallback = 0): number {
  const amount = Number(value.trim());
  return Number.isFinite(amount) ? amount : fallback;
}

/**
 * Resolves the color of a dataset: a palette name (`'visa'`, `'1'`) reads `--<prefix>-color-<name>`;
 * any other value (`var(--i-…)`, `#hex`, `rgb()`) is resolved through a temporary custom property on
 * the host, so ECharts always receives a final color.
 */
export function resolveCssColor(host: HTMLElement, prefix: string, color: string): string {
  const value = NAMED_COLORS.has(color) ? `var(--${prefix}-color-${color})` : color;
  const probe = `--${prefix}-color-probe`;
  host.style.setProperty(probe, value);
  const resolved = getComputedStyle(host).getPropertyValue(probe).trim();
  host.style.removeProperty(probe);
  return resolved || color;
}

/** True when the user asks for less motion: the charts turn their animation off. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calls `onChange` when the theme of the page can have changed (class, style or data-* of <html> and
 * <body>), so a chart reads its tokens again. Returns the function that stops observing.
 */
export function observeThemeChanges(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => undefined;
  const observer = new MutationObserver(onChange);
  const options: MutationObserverInit = {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  };
  observer.observe(document.documentElement, options);
  if (document.body) observer.observe(document.body, options);
  return () => observer.disconnect();
}
