import { Injectable } from '@angular/core';

import {
  CatalogComponent,
  CatalogVariant,
  ComponentDefinition,
  ComponentVersion,
  DocMeta,
  DocRegistry,
  VariantDefinition,
} from './catalog.model';
import { COMPONENT_INVENTORY } from '../components/inventory';
import { DOC_REGISTRY } from '../generated/doc-registry';
import { parseDocHtml } from './doc-html';
import { toSearchKey, toSlug } from './slug';

/** Reads the headers of the HTML files imported as text (title/description of component and variants). */
function withHeaders(version: ComponentVersion): ComponentVersion {
  const exampleMeta = Object.fromEntries(
    Object.entries(version.exampleHtml ?? {}).map(([slug, html]) => [slug, parseDocHtml(html).meta]),
  );
  return {
    ...version,
    ...(version.html !== undefined ? parseDocHtml(version.html).meta : {}),
    exampleMeta: { ...version.exampleMeta, ...exampleMeta },
  };
}

export const COMPONENTS_BASE_PATH = '/components';

/** Query parameter that selects the documented version: /components/<id>?version=<N>. */
export const VERSION_QUERY_PARAM = 'version';

/** "icons-border" → "Icons Border": visible name of an example folder not listed in the config. */
const slugToName = (slug: string) =>
  slug.replace(/(^|-)([a-z0-9])/g, (_, dash: string, char: string) => (dash && ' ') + char.toUpperCase());

/** "basic" first (every component is born with it), then alphabetical. */
const bySlug = (a: string, b: string) =>
  Number(b === 'basic') - Number(a === 'basic') || a.localeCompare(b);

/**
 * Variants are the example folders (variants/<slug>/ of any version), detected automatically. The
 * config only orders them or hides them: an entry without a folder is not documented (hidden entries
 * are kept so their IDs stay reserved). Folders the config does not list go after the listed ones.
 */
function withDetectedVariants(
  definition: ComponentDefinition,
  versions: readonly ComponentVersion[],
): VariantDefinition[] {
  const folders = new Set(versions.flatMap((v) => v.examples));
  const declared = (definition.variants ?? [])
    .map((variant) => (typeof variant === 'string' ? { name: variant } : variant))
    .filter((v) => v.hidden || folders.has(v.slug ?? toSlug(v.name)));
  const declaredSlugs = new Set(declared.map((v) => v.slug ?? toSlug(v.name)));
  const detected = [...folders]
    .filter((slug) => !declaredSlugs.has(slug))
    .sort(bySlug)
    .map((slug) => ({ name: slugToName(slug), slug }));
  return [...declared, ...detected];
}

/** Header of the latest version that has one (base/<id>.html or variants/<slug>/example.html). */
const latestMeta = (metas: readonly (DocMeta | undefined)[]): DocMeta =>
  [...metas].reverse().find((meta) => meta?.title || meta?.description) ?? {};

/**
 * Expands the inventory into catalog entries, attaching the version folders (and their example
 * folders) detected for each component, and fails fast on duplicated or colliding IDs.
 */
export function resolveInventory(
  definitions: readonly ComponentDefinition[],
  registry: DocRegistry = {},
): CatalogComponent[] {
  const usedIds = new Set<string>();
  const claim = (id: string, owner: string) => {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`[inventory] "${id}" (${owner}) is not a valid kebab-case ID.`);
    }
    if (usedIds.has(id)) {
      throw new Error(`[inventory] Duplicated ID "${id}" (${owner}).`);
    }
    usedIds.add(id);
  };

  // IDs are claimed before filtering, so hiding an entry never frees its ID for another one.
  return definitions
    .map((definition) => {
      const owner = definition.name ?? definition.id;
      claim(definition.id, owner);
      // A dependency may not exist yet (it is built with a provisional), but it must be an ID.
      const dependencies = [
        ...(definition.requires ?? []).map((id) => ['requires', id] as const),
        ...(definition.uses ?? []).map((id) => ['uses', id] as const),
      ];
      for (const [kind, dependency] of dependencies) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dependency) || dependency === definition.id) {
          throw new Error(`[inventory] "${owner}" ${kind} an invalid ID "${dependency}".`);
        }
      }
      const path = `${COMPONENTS_BASE_PATH}/${definition.id}`;
      const versions = [...(registry[definition.id] ?? [])]
        .filter((v) => !definition.hiddenVersions?.includes(v.number))
        .sort((a, b) => a.number - b.number)
        .map(withHeaders);
      const header = latestMeta(versions);
      const variants = withDetectedVariants(definition, versions).map((variant) => {
        const {
          name: configName,
          slug = toSlug(configName),
          description: configDescription,
          hidden = false,
        } = typeof variant === 'string' ? { name: variant } : variant;
        // The example.html header wins over the config (which only plans folders not created yet).
        const meta = latestMeta(versions.map((v) => v.exampleMeta?.[slug]));
        const name = meta.title ?? configName;
        const description = meta.description ?? configDescription;
        const id = `${definition.id}-${slug}`;
        claim(id, `${owner} › ${name}`);
        return {
          hidden,
          variant: {
            id,
            slug,
            name,
            description,
            componentId: definition.id,
            path,
          } satisfies CatalogVariant,
        };
      });
      return {
        hidden: definition.hidden ?? false,
        component: {
          id: definition.id,
          name: header.title ?? definition.name ?? slugToName(definition.id),
          description: header.description,
          path,
          variants: variants.filter((v) => !v.hidden).map((v) => v.variant),
          hiddenVariantIds: variants.filter((v) => v.hidden).map((v) => v.variant.id),
          versions,
          reference: definition.reference ?? false,
          requires: definition.requires ?? [],
          uses: definition.uses ?? [],
          loadRoutes: definition.loadRoutes,
        } satisfies CatalogComponent,
      };
    })
    .filter((entry) => !entry.hidden)
    .map((entry) => entry.component);
}

/** Resolved catalog (hidden entries excluded), available statically so route configuration can be built from it. */
export const CATALOG: readonly CatalogComponent[] = resolveInventory(
  COMPONENT_INVENTORY,
  DOC_REGISTRY,
);

const componentsById = new Map(CATALOG.map((c) => [c.id, c]));
const variantsById = new Map(CATALOG.flatMap((c) => c.variants.map((v) => [v.id, v] as const)));

export const findComponent = (componentId: string): CatalogComponent | undefined =>
  componentsById.get(componentId);

/** Looks up a variant by its global ID (the URL fragment). */
export const findVariant = (variantId: string): CatalogVariant | undefined =>
  variantsById.get(variantId);

/** Resolves `/components/<componentId>/<segment>` where segment is a variant slug or full ID. */
export const findVariantInComponent = (
  componentId: string,
  segment: string,
): CatalogVariant | undefined =>
  findComponent(componentId)?.variants.find((v) => v.slug === segment || v.id === segment);

/** Version selected by the `version` query param; the latest one when it is missing or unknown. */
export const findVersion = (
  component: CatalogComponent,
  requested: string | null | undefined,
): ComponentVersion | undefined =>
  component.versions.find((v) => String(v.number) === requested) ?? component.versions.at(-1);

/** DI entry point for views; route configuration uses the plain functions above. */
@Injectable({ providedIn: 'root' })
export class ComponentCatalog {
  readonly components = CATALOG;
  readonly find = findComponent;
  readonly findVariant = findVariant;

  /** Filters by component name only (not by variants, categories or code). */
  searchByName(term: string): readonly CatalogComponent[] {
    const key = toSearchKey(term);
    return key ? this.components.filter((c) => toSearchKey(c.name).includes(key)) : this.components;
  }
}
