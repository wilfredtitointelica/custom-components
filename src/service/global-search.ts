import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ComponentCatalog } from './component-catalog';
import { findMatchRange } from './slug';

export interface SearchResult {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /** Matched range of `label`, for highlighting. */
  readonly match: readonly [number, number];
}

export interface SearchGroup {
  readonly id: string;
  readonly label: string;
  readonly results: readonly SearchResult[];
}

/**
 * Site-wide search opened from the navigation rail. Today it only indexes component names;
 * new sections add their own group in `groups`.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearch {
  private readonly catalog = inject(ComponentCatalog);

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
    return components.length ? [{ id: 'components', label: 'Components', results: components }] : [];
  });

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
