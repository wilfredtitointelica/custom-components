import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ComponentCatalog, findVersion, VERSION_QUERY_PARAM } from './component-catalog';

/** Query parameter that selects the tab of a documentation page: /components/<id>?tab=api|compositions. */
export const TAB_QUERY_PARAM = 'tab';
export type DocTab = 'variants' | 'api' | 'compositions';

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

  /** Second URL segment under /components (component id or a fixed page such as 'skills'). */
  readonly page = computed(() => {
    const [section, page] = this.segments();
    return section === 'components' ? (page ?? null) : null;
  });

  /** Current #fragment, if any. */
  readonly fragment = computed(() => this.urlTree().fragment);

  /** ID of the component whose page is open, if any. */
  readonly componentId = computed(() => {
    const [section, componentId] = this.segments();
    return section === 'components' && componentId && this.catalog.find(componentId)
      ? componentId
      : null;
  });

  /** Documented version of the open component: ?version=<N>, or its latest version folder. */
  readonly activeVersion = computed(() => {
    const componentId = this.componentId();
    const component = componentId ? this.catalog.find(componentId) : undefined;
    return component && findVersion(component, this.urlTree().queryParams[VERSION_QUERY_PARAM]);
  });

  /**
   * Tab of the documentation page: a fragment pointing at an example opens its tab (variants or
   * compositions); otherwise ?tab=api or ?tab=compositions, and Variants by default.
   */
  readonly activeTab = computed<DocTab>(() => {
    const variantId = this.activeVariantId();
    if (variantId) {
      return this.catalog.findVariant(variantId)?.kind === 'composition'
        ? 'compositions'
        : 'variants';
    }
    const tab = this.urlTree().queryParams[TAB_QUERY_PARAM];
    if (tab === 'api') return 'api';
    // A component without compositions has no such tab: the link falls back to Variants.
    const componentId = this.componentId();
    const hasCompositions = !!componentId && !!this.catalog.find(componentId)?.compositions.length;
    return tab === 'compositions' && hasCompositions ? 'compositions' : 'variants';
  });

  /** Selected variant: the fragment, only when it belongs to the open component. */
  readonly activeVariantId = computed(() => {
    const fragment = this.urlTree().fragment;
    const componentId = this.componentId();
    if (!fragment || !componentId) return null;
    return this.catalog.findVariant(fragment)?.componentId === componentId ? fragment : null;
  });
}
