import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ComponentCatalog } from '../../../service/component-catalog';
import { MAIN_SECTIONS } from '../../../service/main-navigation';

/** Landing view of /components. */
@Component({
  selector: 'app-components-overview',
  imports: [RouterLink],
  templateUrl: './components-overview.html',
  styleUrl: './components-overview.scss',
})
export class ComponentsOverview {
  protected readonly total = inject(ComponentCatalog).components.length;
  protected readonly sections = MAIN_SECTIONS;
}
