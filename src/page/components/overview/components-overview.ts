import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ComponentCatalog } from '../../../service/component-catalog';
import { MAIN_SECTIONS } from '../../../service/main-navigation';
import { CATALOG_PATH } from '../catalog/catalog-route';

/** Landing view of /components. */
@Component({
  selector: 'app-components-overview',
  imports: [RouterLink],
  templateUrl: './components-overview.html',
  styleUrl: './components-overview.scss',
})
export class ComponentsOverview {
  protected readonly total = inject(ComponentCatalog).components.length;
  /** The "Components" card opens the gallery; the other sections go to their own page. */
  protected readonly sections = MAIN_SECTIONS.map((section) => ({
    ...section,
    link: section.id === 'components' ? CATALOG_PATH : section.path,
  }));
}
