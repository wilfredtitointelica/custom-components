import { LoadChildrenCallback } from '@angular/router';

/**
 * A variant declared in the inventory. A plain string is the visible name; use the object form
 * only to pin a custom slug (the slug becomes part of the stable variant ID).
 */
export type VariantDefinition = string | { readonly name: string; readonly slug: string };

/** One row of the component inventory (source: "Listado de componentes a replicar" Excel). */
export interface ComponentDefinition {
  /** Stable kebab-case ID. Used as route segment (/components/<id>) and folder name. Never rename. */
  readonly id: string;
  /** Visible name, exactly as written in the Excel. */
  readonly name: string;
  /** Variants in display order. Omit when they have not been defined yet. */
  readonly variants?: readonly VariantDefinition[];
  /** Lazy reference to the component's own routes file (src/components/<id>/routes.ts). */
  readonly loadRoutes: LoadChildrenCallback;
}

export interface CatalogVariant {
  /** Globally unique ID, `<componentId>-<slug>`. Used as DOM id and URL fragment. */
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly componentId: string;
  /** Route of the documentation page that contains this variant. */
  readonly path: string;
}

export interface CatalogComponent {
  readonly id: string;
  readonly name: string;
  /** Absolute route of the documentation page: /components/<id>. */
  readonly path: string;
  readonly variants: readonly CatalogVariant[];
  readonly loadRoutes: LoadChildrenCallback;
}

/** Languages offered by the code panel. Extend here to add tabs (e.g. 'scss'). */
export const CODE_LANGUAGES = ['html', 'ts'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
