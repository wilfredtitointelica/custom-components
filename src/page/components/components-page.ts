import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

import { BrandMark } from '../../core/brand-mark/brand-mark';
import { ToggleCode } from '../../core/toggle-code/toggle-code';
import { ComponentCatalog } from '../../service/component-catalog';
import { NavigationState } from '../../service/navigation-state';
import { ComponentNav } from './component-nav/component-nav';

/** Gap kept between the sticky top bar and an anchored section. */
const ANCHOR_GAP = 16;

/** Catalog shell: navigation drawer + content pane with a sticky top app bar. */
@Component({
  selector: 'app-components-page',
  imports: [RouterOutlet, RouterLink, ComponentNav, ToggleCode, BrandMark],
  templateUrl: './components-page.html',
  styleUrl: './components-page.scss',
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
})
export class ComponentsPage {
  private readonly catalog = inject(ComponentCatalog);
  private readonly nav = inject(NavigationState);
  private readonly topbar = viewChild.required<ElementRef<HTMLElement>>('topbar');

  protected readonly drawerOpen = signal(false);

  protected readonly component = computed(() => {
    const id = this.nav.componentId();
    return id ? this.catalog.find(id) : undefined;
  });
  protected readonly variant = computed(() => {
    const id = this.nav.activeVariantId();
    return id ? this.catalog.findVariant(id) : undefined;
  });

  constructor() {
    // The top bar is sticky: anchor scrolling must stop below it, whatever its current height.
    inject(ViewportScroller).setOffset(() => [0, this.topbar().nativeElement.offsetHeight + ANCHOR_GAP]);
  }
}
