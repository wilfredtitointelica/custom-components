import { Component, inject } from '@angular/core';

import { ComponentCatalog } from '../../../service/component-catalog';

/** Landing view of /components. */
@Component({
  selector: 'app-components-overview',
  templateUrl: './components-overview.html',
  styleUrl: './components-overview.scss',
})
export class ComponentsOverview {
  protected readonly total = inject(ComponentCatalog).components.length;
}
