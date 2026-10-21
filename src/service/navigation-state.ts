import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ComponentCatalog } from './component-catalog';

/** Derives the current selection (section, component, variant) from the URL. The URL is the only source of truth. */
@Injectable({ providedIn: 'root' })
export class NavigationState {
  private readonly router = inject(Router);
  private readonly catalog = inject(ComponentCatalog);
  private readonly urlTree = signal(this.router.parseUrl(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.urlTree.set(this.router.parseUrl(this.router.url)));
  }

  private readonly segments = computed(
    () => this.urlTree().root.children[PRIMARY_OUTLET]?.segments.map((s) => s.path) ?? [],
  );

  /** First URL segment: 'components', 'prototypes', … */
  readonly section = computed(() => this.segments()[0] ?? null);

  /** ID of the component whose page is open, if any. */
  readonly componentId = computed(() => {
    const [section, componentId] = this.segments();
    return section === 'components' && componentId && this.catalog.find(componentId) ? componentId : null;
  });

  /** Selected variant: the fragment, only when it belongs to the open component. */
  readonly activeVariantId = computed(() => {
    const fragment = this.urlTree().fragment;
    const componentId = this.componentId();
    if (!fragment || !componentId) return null;
    return this.catalog.findVariant(fragment)?.componentId === componentId ? fragment : null;
  });
}
