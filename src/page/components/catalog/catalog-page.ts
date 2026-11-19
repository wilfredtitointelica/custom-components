import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InlineCode } from '../../../core/inline-code/inline-code';
import { StatusChip } from '../../../core/status-chip/status-chip';
import { CatalogComponent, ComponentStatus } from '../../../service/catalog.model';
import { ComponentCatalog } from '../../../service/component-catalog';
import { CatalogArt } from './catalog-art/catalog-art';
import { groupComponents } from './catalog-groups';

interface CatalogCard {
  readonly component: CatalogComponent;
  readonly status: ComponentStatus;
}

const toCard = (component: CatalogComponent): CatalogCard => ({
  component,
  status: component.versions.at(-1)?.status ?? 'pending',
});

/**
 * /components/catalog: every component (reference implementations excluded) as a card, grouped by
 * purpose (CATALOG_GROUPS), with its drawing (CatalogArt) as cover. Status is the one of the latest version.
 */
@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, StatusChip, InlineCode, CatalogArt],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly components = inject(ComponentCatalog).components.filter((c) => !c.reference);

  protected readonly total = this.components.length;

  protected readonly groups = groupComponents(this.components).map((group) => ({
    name: group.name,
    cards: group.items.map(toCard),
  }));
}
