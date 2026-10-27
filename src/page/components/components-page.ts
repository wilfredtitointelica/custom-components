import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

import { BrandMark } from '../../core/brand-mark/brand-mark';
import { StyleGuideButton } from '../../core/style-guide/style-guide-button';
import { ToggleCode } from '../../core/toggle-code/toggle-code';
import { ComponentCatalog } from '../../service/component-catalog';
import { NavigationState } from '../../service/navigation-state';
import { ComponentNav } from './component-nav/component-nav';
import { SKILLS_SEGMENT } from './skills/skills-sections';
import { STATUS_SEGMENT } from './status/status-route';

/** Fixed pages under /components (pinned under "Reference" in the menu): URL segment → breadcrumb label. */
const REFERENCE_PAGES: Readonly<Record<string, string>> = { [SKILLS_SEGMENT]: 'Skills', [STATUS_SEGMENT]: 'Status' };

/** Gap kept between the sticky top bar and an anchored section. */
const ANCHOR_GAP = 16;

/** Catalog shell: navigation drawer + content pane with a sticky top app bar. */
@Component({
  selector: 'app-components-page',
  imports: [RouterOutlet, RouterLink, ComponentNav, StyleGuideButton, ToggleCode, BrandMark],
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
  protected readonly referencePage = computed(() => REFERENCE_PAGES[this.nav.page() ?? ''] ?? null);

  constructor() {
    // The top bar is sticky, and so is the page's [data-doc-sticky] block (chips of the component page):
    // anchor scrolling must stop below both, whatever their current height.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    inject(ViewportScroller).setOffset(() => {
      const sticky = host.querySelector<HTMLElement>('[data-doc-sticky]')?.offsetHeight ?? 0;
      return [0, this.topbar().nativeElement.offsetHeight + sticky + ANCHOR_GAP];
    });
  }
}
