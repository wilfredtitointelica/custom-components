import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BrandMark } from '../../core/brand-mark/brand-mark';
import { ExternalResources } from '../../service/external-resources';
import { IconLabQuery } from '../../service/icon-lab-query';
import { NavigationState } from '../../service/navigation-state';
import { IconGallery } from './icon-gallery/icon-gallery';
import { IconNav } from './icon-nav/icon-nav';
import { IconSearch } from './icon-search/icon-search';
import { filterIcons, ICON_LAB_PATH } from './icon-sections';

/** Gap kept between the sticky top bar and an anchored section. */
const ANCHOR_GAP = 16;

/**
 * /icon-lab: catalog of the Incontrol icons, with the same shell as /components (drawer + pane with a
 * sticky top bar). The active menu entry is the URL #fragment (the section last clicked or linked).
 */
@Component({
  selector: 'app-icon-lab',
  imports: [RouterLink, BrandMark, IconNav, IconGallery, IconSearch],
  templateUrl: './icon-lab.html',
  styleUrl: './icon-lab.scss',
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
})
export class IconLabPage {
  private readonly nav = inject(NavigationState);
  private readonly topbar = viewChild.required<ElementRef<HTMLElement>>('topbar');

  protected readonly path = ICON_LAB_PATH;
  protected readonly drawerOpen = signal(false);
  protected readonly active = computed(() => this.nav.fragment());
  /** Search of the top bar: menu and gallery show only what matches. */
  protected readonly query = inject(IconLabQuery).query;
  protected readonly results = computed(() => filterIcons(this.query()));
  /** Shown at the right of the top bar: the glyphs come from the style guide bundle or the local copy. */
  protected readonly iconSource = inject(ExternalResources).iconSource;

  constructor() {
    // The top bar is sticky: anchor scrolling must stop below it, whatever its current height.
    inject(ViewportScroller).setOffset(() => [0, this.topbar().nativeElement.offsetHeight + ANCHOR_GAP]);
  }
}
