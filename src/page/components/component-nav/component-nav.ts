import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ComponentCatalog } from '../../../service/component-catalog';
import { NavigationState } from '../../../service/navigation-state';

/** Nearest ancestor that scrolls vertically (the drawer), or null. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}

/** Side menu: one expandable entry per inventory component. */
@Component({
  selector: 'app-component-nav',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './component-nav.html',
  styleUrl: './component-nav.scss',
})
export class ComponentNav {
  /** Emitted after following a link (used to close the drawer on small screens). */
  readonly navigated = output<void>();

  private readonly catalog = inject(ComponentCatalog).components;
  /** Reference implementations (_demo_), pinned above the divider. */
  protected readonly references = this.catalog.filter((c) => c.reference);
  protected readonly components = this.catalog.filter((c) => !c.reference);
  protected readonly nav = inject(NavigationState);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Keep the open component expanded and visible in the drawer (click, direct URL, reload,
    // shared link, search): the drawer scrolls on its own, so it would otherwise start at the top.
    effect(() => {
      const componentId = this.nav.componentId();
      if (!componentId) return;
      untracked(() => this.setExpanded(componentId, true));
      afterNextRender(() => this.revealCurrent(), { injector: this.injector });
    });
  }

  protected isExpanded(componentId: string): boolean {
    return this.expanded().has(componentId);
  }

  protected toggle(componentId: string): void {
    this.setExpanded(componentId, !this.isExpanded(componentId));
  }

  private setExpanded(componentId: string, open: boolean): void {
    this.expanded.update((current) => {
      if (current.has(componentId) === open) return current;
      const next = new Set(current);
      if (open) next.add(componentId);
      else next.delete(componentId);
      return next;
    });
  }

  /**
   * Scrolls the drawer (not the page) so the open component and its variants are visible.
   * Does nothing when it is already in view, so clicking in the menu never makes it jump.
   */
  private revealCurrent(): void {
    const row = this.host.nativeElement.querySelector<HTMLElement>('.nav-row.is-current');
    const item = row?.closest<HTMLElement>('.nav-item');
    const drawer = item && scrollParent(item);
    if (!row || !item || !drawer) return;

    const view = drawer.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (rowBox.top >= view.top && itemBox.bottom <= view.bottom) return;

    // Row near the top, leaving room below for its variant list.
    drawer.scrollTop += rowBox.top - view.top - Math.min(view.height / 4, 120);
  }
}
