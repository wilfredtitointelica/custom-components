import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  FOUNDATION_SECTIONS,
  ICON_BRANDS,
  ICON_CATEGORIES,
  ICON_LAB_PATH,
  ICON_SIZES,
  IconSection,
} from '../page/icon-lab/icon-sections';
import { ComponentCatalog } from './component-catalog';
import { IconLabQuery } from './icon-lab-query';
import { findMatchRange } from './slug';

export interface SearchResult {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /** #fragment of the target, if any. */
  readonly fragment?: string;
  /** Muted text after the label (e.g. the category of an icon). */
  readonly hint?: string;
  /** Matched range of `label`, for highlighting. */
  readonly match: readonly [number, number];
  /** Runs when the result is followed, before navigating. */
  readonly select?: () => void;
}

export interface SearchGroup {
  readonly id: string;
  readonly label: string;
  readonly results: readonly SearchResult[];
}

/** Length of the `icon-` / `icon--` prefix shared by every icon name. */
const ICON_PREFIX = /^icon-+/;

/** Every Icon Lab section with its items' names (sizes, brands, then the categories of the JSON). */
const ICON_LAB_SECTIONS: readonly (IconSection & { readonly names: readonly string[] })[] = [
  { ...FOUNDATION_SECTIONS.sizes, names: ICON_SIZES.map((item) => item.name) },
  { ...FOUNDATION_SECTIONS.brands, names: ICON_BRANDS.map((item) => item.name) },
  ...ICON_CATEGORIES.map((category) => ({ ...category, names: category.icons.map((icon) => icon.name) })),
];

/**
 * Site-wide search opened from the navigation rail: component names and the Icon Lab (section
 * titles and icon names), one group per view.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearch {
  private readonly catalog = inject(ComponentCatalog);
  private readonly iconQuery = inject(IconLabQuery).query;

  readonly isOpen = signal(false);
  readonly query = signal('');

  readonly groups = computed<readonly SearchGroup[]>(() => {
    const term = this.query().trim();
    if (!term) return [];
    const components = this.catalog.searchByName(term).map((component) => ({
      id: component.id,
      label: component.name,
      path: component.path,
      match: findMatchRange(component.name, term)!,
    }));
    const icons = this.searchIconLab(term);
    return [
      { id: 'components', label: 'Components', results: components },
      { id: 'icon-lab', label: 'Icon Lab', results: icons },
    ].filter((group) => group.results.length);
  });

  /**
   * Sections whose title matches, then icons whose name matches beyond the shared `icon-` prefix (so
   * "icon" alone doesn't list every icon). Both open the Icon Lab at their section, clearing its own
   * search so that section is never hidden.
   */
  private searchIconLab(term: string): SearchResult[] {
    const sections: SearchResult[] = [];
    const icons: SearchResult[] = [];
    for (const section of ICON_LAB_SECTIONS) {
      const titleMatch = findMatchRange(section.name, term);
      if (titleMatch) {
        sections.push({
          id: section.slug,
          label: section.name,
          hint: `${section.names.length} ${section.names.length === 1 ? 'icono' : 'iconos'}`,
          path: ICON_LAB_PATH,
          fragment: section.slug,
          match: titleMatch,
          select: () => this.iconQuery.set(''),
        });
      }
      for (const name of section.names) {
        const match = findMatchRange(name, term);
        if (!match || match[1] <= (name.match(ICON_PREFIX)?.[0].length ?? 0)) continue;
        icons.push({
          id: `${section.slug}/${name}`,
          label: name,
          hint: section.name,
          path: ICON_LAB_PATH,
          fragment: section.slug,
          match,
          select: () => this.iconQuery.set(''),
        });
      }
    }
    return [...sections, ...icons];
  }

  constructor() {
    // Following a result (or any navigation) closes the search view.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.close());
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }
}
