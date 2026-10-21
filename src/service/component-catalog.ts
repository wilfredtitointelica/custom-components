import { Injectable } from '@angular/core';

import { CatalogComponent, CatalogVariant, ComponentDefinition } from './catalog.model';
import { COMPONENT_INVENTORY } from './component-inventory';
import { toSearchKey, toSlug } from './slug';

export const COMPONENTS_BASE_PATH = '/components';

/** Expands the inventory into catalog entries and fails fast on duplicated or colliding IDs. */
export function resolveInventory(definitions: readonly ComponentDefinition[]): CatalogComponent[] {
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

  return definitions.map((definition) => {
    claim(definition.id, definition.name);
    const path = `${COMPONENTS_BASE_PATH}/${definition.id}`;
    const variants = (definition.variants ?? []).map((variant): CatalogVariant => {
      const name = typeof variant === 'string' ? variant : variant.name;
      const slug = typeof variant === 'string' ? toSlug(variant) : variant.slug;
      const id = `${definition.id}-${slug}`;
      claim(id, `${definition.name} › ${name}`);
      return { id, slug, name, componentId: definition.id, path };
    });
    return { id: definition.id, name: definition.name, path, variants, loadRoutes: definition.loadRoutes };
  });
}

/** Resolved catalog, available statically so route configuration can be built from it. */
export const CATALOG: readonly CatalogComponent[] = resolveInventory(COMPONENT_INVENTORY);

const componentsById = new Map(CATALOG.map((c) => [c.id, c]));
const variantsById = new Map(CATALOG.flatMap((c) => c.variants.map((v) => [v.id, v] as const)));

export const findComponent = (componentId: string): CatalogComponent | undefined =>
  componentsById.get(componentId);

/** Looks up a variant by its global ID (the URL fragment). */
export const findVariant = (variantId: string): CatalogVariant | undefined => variantsById.get(variantId);

/** Resolves `/components/<componentId>/<segment>` where segment is a variant slug or full ID. */
export const findVariantInComponent = (componentId: string, segment: string): CatalogVariant | undefined =>
  findComponent(componentId)?.variants.find((v) => v.slug === segment || v.id === segment);

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
