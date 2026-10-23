import CATEGORIES from './icon-categories.json';
import { placeholderIcon } from './icon-placeholders';

export const ICON_LAB_PATH = '/icon-lab';

export interface IconItem {
  readonly name: string;
  /** primeicons class used as placeholder (see icon-placeholders.ts). */
  readonly glyph: string;
}

export interface IconSection {
  /** Section id and #fragment of its menu link. */
  readonly slug: string;
  readonly name: string;
}

export interface IconCategory extends IconSection {
  readonly icons: readonly IconItem[];
}

export interface IconSize {
  readonly size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly name: string;
}

export interface IconBrand {
  readonly name: string;
  /** Text of the referential brand mark. */
  readonly label: string;
}

/** Fixed sections shown before the categories (the slugs never clash with the JSON ones). */
export const FOUNDATION_SECTIONS = {
  sizes: { slug: 'icon-size', name: 'Tamaños' },
  brands: { slug: 'icon-brand', name: 'Marcas' },
} as const satisfies Record<string, IconSection>;

export const ICON_SIZES: readonly IconSize[] = (['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => ({
  size,
  name: `icon--${size}`,
}));

export const ICON_BRANDS: readonly IconBrand[] = [
  { name: 'icon-visa', label: 'VISA' },
  { name: 'icon-mastercard', label: '' },
  { name: 'icon-amex', label: 'AMEX' },
];

/** Categories of icon-categories.json, in file order; repeated names inside a category are shown once. */
export const ICON_CATEGORIES: readonly IconCategory[] = (
  CATEGORIES as readonly { category: string; slug: string; icons: readonly string[] }[]
).map((category) => ({
  slug: category.slug,
  name: category.category,
  icons: [...new Set(category.icons)].map((name) => ({ name, glyph: placeholderIcon(name) })),
}));

/** Distinct icon names across every category. */
export const ICON_TOTAL = new Set(ICON_CATEGORIES.flatMap((category) => category.icons.map((icon) => icon.name)))
  .size;

/** What the Icon Lab search leaves visible (sections without items are dropped). */
export interface IconResults {
  readonly sizes: readonly IconSize[];
  readonly brands: readonly IconBrand[];
  readonly categories: readonly IconCategory[];
}

/**
 * Filters every section by `query` (case-insensitive substring). A section whose title matches keeps
 * all its items; otherwise only the items whose name matches. An empty query keeps everything.
 */
export function filterIcons(query: string): IconResults {
  const q = query.trim().toLowerCase();
  const has = (text: string) => text.toLowerCase().includes(q);
  const pick = <T extends { name: string }>(title: string, items: readonly T[]) =>
    !q || has(title) ? items : items.filter((item) => has(item.name));

  return {
    sizes: pick(FOUNDATION_SECTIONS.sizes.name, ICON_SIZES),
    brands: pick(FOUNDATION_SECTIONS.brands.name, ICON_BRANDS),
    categories: ICON_CATEGORIES.map((category) => ({ ...category, icons: pick(category.name, category.icons) })).filter(
      (category) => category.icons.length,
    ),
  };
}

export interface TextPart {
  readonly text: string;
  readonly match: boolean;
}

/** Splits `text` into the parts that match `query` (case-insensitive) and the rest, to highlight them. */
export function splitMatches(text: string, query: string): readonly TextPart[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];
  const parts: TextPart[] = [];
  const lower = text.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + q.length), match: true });
    from = at + q.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}
