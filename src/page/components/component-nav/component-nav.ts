import { Component, effect, inject, output, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ComponentCatalog } from '../../../service/component-catalog';
import { NavigationState } from '../../../service/navigation-state';

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

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Keep the open component expanded (click, direct URL, reload, shared link).
    effect(() => {
      const componentId = this.nav.componentId();
      if (componentId) untracked(() => this.setExpanded(componentId, true));
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
}
