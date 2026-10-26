import { LoadChildrenCallback } from '@angular/router';

/**
 * A variant listed in a component's config, only to order or hide it. Variants are the
 * version-N/variants/<slug>/ folders, detected automatically: an entry without a folder is not
 * documented. Its title and description come from the header of its example.html.
 */
export type VariantDefinition =
  | string
  | {
      readonly name: string;
      readonly slug?: string;
      /** One line shown under the section title. */
      readonly description?: string;
      /** true = not shown in the menu nor in the documentation page. */
      readonly hidden?: boolean;
    };

/**
 * Documentation config of one component, owned by its folder: src/components/<id>/<id>.config.ts.
 * It drives the side menu (component + variant list), the routes, the search and the page sections.
 */
export interface ComponentDefinition {
  /**
   * Stable kebab-case ID. Used as route segment (/components/<id>) and folder name. Rename it only with
   * `npm run rename -- component` (it renames every file, selector and class derived from it).
   */
  readonly id: string;
  /**
   * Fallback visible name. The title and description are written in the header comment of
   * version-N/base/<id>.html (see DocMeta); this is only used when that header has no title.
   */
  readonly name?: string;
  /** Original Excel name, only when the visible name was simplified (traceability). */
  readonly sourceName?: string;
  /**
   * Variants in display order (names, descriptions, hidden). Example folders not listed here are
   * appended automatically, alphabetically.
   */
  readonly variants?: readonly VariantDefinition[];
  /** true = the component is left out of the menu, the routes and the search. */
  readonly hidden?: boolean;
  /**
   * Version numbers left out of the version picker (their folders stay; `?version=N` opens the latest
   * visible one). Variants that only exist in hidden versions are not documented either.
   */
  readonly hiddenVersions?: readonly number[];
  /**
   * true = reference implementation for the maquetador (e.g. _demo_): pinned at the top of the menu,
   * above a divider, and not counted as a component.
   */
  readonly reference?: boolean;
  /** Lazy reference to the component's own routes file (src/components/<id>/routes.ts). */
  readonly loadRoutes: LoadChildrenCallback;
}

/** Code of one example, as written in its variants/<slug>/ folder. */
export type DocExampleCode = Readonly<Partial<Record<CodeLanguage, string>>>;

/** One example folder (version-N/variants/<slug>/), as emitted in the lazy chunk of its version. */
export interface DocExampleSource {
  readonly slug: string;
  /** The example.ts module: its exported component is the preview. */
  readonly module: Readonly<Record<string, unknown>>;
  /** example.html (with its header) and example.ts, imported as text. */
  readonly sources: DocExampleCode;
}

/**
 * Title and description written in the header comment of an HTML file (base/<id>.html for the
 * component, variants/<slug>/example.html for a variant). Angular drops comments, so it never renders:
 *   <!--
 *     title: Raised
 *     description: Raised buttons display a shadow to indicate elevation.
 *   -->
 */
export interface DocMeta {
  readonly title?: string;
  readonly description?: string;
  /** Figma "Link to selection" of the version's design (base/<id>.html only; empty = none yet). */
  readonly figma?: string;
}

/**
 * Implementation status of one version, declared as a static property of the class in its base/<id>.ts:
 *   static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
 * Read by scripts/generate-docs.mjs; no property = 'pending'. Changed with `npm run set:status`.
 *   pending      → structure only (new component or new version), nobody working on it yet
 *   in-progress  → the maquetador is implementing it
 *   done         → finished
 */
export type ComponentStatus = 'pending' | 'in-progress' | 'done';

/** One implementation folder (version-N) of a component, detected by scripts/generate-docs.mjs. */
export interface ComponentVersion extends DocMeta {
  readonly number: number;
  /** Folder name: version-<number>. */
  readonly folder: string;
  /** From the static `status` property of base/<id>.ts (absent = pending). */
  readonly status?: ComponentStatus;
  /** From the static `designer` property of base/<id>.ts: who designs this version ('' = unassigned). */
  readonly designer?: string;
  /** Slugs of its variants/<slug>/ example folders. */
  readonly examples: readonly string[];
  /** Header of each example.html, by slug (only the examples that have one). */
  readonly exampleMeta?: Readonly<Record<string, DocMeta>>;
  /** base/<id>.html as text (generated registry): its header gives title and description. */
  readonly html?: string;
  /** Each variants/<slug>/example.html as text (generated registry): headers of the variants. */
  readonly exampleHtml?: Readonly<Record<string, string>>;
  /** Lazy chunk with the examples (absent when the version has none yet). */
  readonly loadExamples?: () => Promise<{ default: readonly DocExampleSource[] }>;
}

/** src/generated/doc-registry.ts: versions of each component, by component ID. */
export type DocRegistry = Readonly<Record<string, readonly ComponentVersion[]>>;

export interface CatalogVariant {
  /** Globally unique ID, `<componentId>-<slug>`. Used as DOM id and URL fragment. */
  readonly id: string;
  /** Also the name of its example folder: version-N/variants/<slug>/. */
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly componentId: string;
  /** Route of the documentation page that contains this variant. */
  readonly path: string;
}

export interface CatalogComponent {
  readonly id: string;
  /** Title of the latest version's base/<id>.html header (fallback: config name, then the ID). */
  readonly name: string;
  readonly description?: string;
  /** Absolute route of the documentation page: /components/<id>. */
  readonly path: string;
  /** Visible variants, in display order. */
  readonly variants: readonly CatalogVariant[];
  /** IDs of variants marked `hidden` (their IDs stay reserved). */
  readonly hiddenVariantIds: readonly string[];
  /** Implementation folders (version-N), ascending. The last one is shown by default. */
  readonly versions: readonly ComponentVersion[];
  /** Reference implementation (e.g. _demo_), pinned above the component list in the menu. */
  readonly reference: boolean;
  readonly loadRoutes: LoadChildrenCallback;
}

/** Languages offered by the code panel. Extend here to add tabs (e.g. 'scss'). */
export const CODE_LANGUAGES = ['html', 'ts'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
