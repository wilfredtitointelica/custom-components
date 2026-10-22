import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusChip } from '../../../core/status-chip/status-chip';
import { CatalogComponent, ComponentStatus } from '../../../service/catalog.model';
import { ComponentCatalog } from '../../../service/component-catalog';
import { CATALOG_GROUPS, CATALOG_ICONS, DEFAULT_ICON, OTHER_GROUP } from './catalog-groups';

interface CatalogCard {
  readonly component: CatalogComponent;
  readonly icon: string;
  readonly status: ComponentStatus;
}

const toCard = (component: CatalogComponent): CatalogCard => ({
  component,
  icon: CATALOG_ICONS[component.id] ?? DEFAULT_ICON,
  status: component.versions.at(-1)?.status ?? 'pending',
});

/**
 * /components/catalog: every component (reference implementations excluded) as a card, grouped by
 * purpose (CATALOG_GROUPS). Status is the one of the latest version.
 */
@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, StatusChip],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly components = inject(ComponentCatalog).components.filter((c) => !c.reference);

  protected readonly total = this.components.length;

  protected readonly groups = (() => {
    const byId = new Map(this.components.map((c) => [c.id, c]));
    const grouped = CATALOG_GROUPS.map((group) => ({
      name: group.name,
      cards: group.ids.flatMap((id) => {
        const component = byId.get(id);
        byId.delete(id);
        return component ? [toCard(component)] : [];
      }),
    }));
    const others = { name: OTHER_GROUP, cards: [...byId.values()].map(toCard) };
    return [...grouped, others].filter((group) => group.cards.length);
  })();
}
