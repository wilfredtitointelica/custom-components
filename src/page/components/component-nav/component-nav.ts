import { Component, computed, effect, inject, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Search } from '../../../core/search/search';
import { ComponentCatalog } from '../../../service/component-catalog';
import { NavigationState } from '../../../service/navigation-state';

/** Side menu: name search + one expandable entry per inventory component. */
@Component({
  selector: 'app-component-nav',
  imports: [RouterLink, Search],
  templateUrl: './component-nav.html',
  styleUrl: './component-nav.scss',
})
export class ComponentNav {
  /** Emitted after following a link (used to close the drawer on small screens). */
  readonly navigated = output<void>();

  private readonly catalog = inject(ComponentCatalog);
  protected readonly nav = inject(NavigationState);

  protected readonly query = signal('');
  protected readonly results = computed(() => this.catalog.searchByName(this.query()));
  protected readonly total = this.catalog.components.length;

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
