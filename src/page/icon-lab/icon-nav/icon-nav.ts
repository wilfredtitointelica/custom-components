import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { filterIcons, FOUNDATION_SECTIONS, ICON_LAB_PATH, IconResults } from '../icon-sections';

/** Nearest ancestor that scrolls vertically (the drawer), or null. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}

/** Side menu of the Icon Lab: one link per section (#slug), highlighting the one in view. */
@Component({
  selector: 'app-icon-nav',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './icon-nav.html',
  styleUrl: './icon-nav.scss',
})
export class IconNav {
  /** Slug of the section in view. */
  readonly active = input<string | null>(null);
  /** Emitted after following a link (used to close the drawer on small screens). */
  readonly navigated = output<void>();

  /** Sections left by the search of the top bar (everything when it is empty). */
  readonly results = input<IconResults>(filterIcons(''));

  protected readonly path = ICON_LAB_PATH;
  protected readonly foundations = computed(() => {
    const { sizes, brands } = this.results();
    return [
      ...(sizes.length ? [FOUNDATION_SECTIONS.sizes] : []),
      ...(brands.length ? [FOUNDATION_SECTIONS.brands] : []),
    ];
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // The drawer scrolls on its own: keep the active entry in view while the page scrolls.
    effect(() => {
      if (this.active()) afterNextRender(() => this.revealCurrent(), { injector: this.injector });
    });
  }

  /** Scrolls the drawer (not the page) only when the active entry is out of view. */
  private revealCurrent(): void {
    const link = this.host.nativeElement.querySelector<HTMLElement>('.doc-nav-link.doc-is-current');
    const drawer = link && scrollParent(link);
    if (!link || !drawer) return;

    const view = drawer.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    // 48px of margin at the top for the sticky group label.
    if (box.top >= view.top + 48 && box.bottom <= view.bottom) return;
    drawer.scrollTop += box.top - view.top - view.height / 3;
  }
}
