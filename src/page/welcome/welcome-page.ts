import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ComponentCatalog } from '../../service/component-catalog';
import { MAIN_SECTIONS } from '../../service/main-navigation';

/** Welcome view (/): hero + sections, outside the components shell (no drawer, no top bar). */
@Component({
  selector: 'app-welcome-page',
  imports: [RouterLink],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
})
export class WelcomePage {
  /** Reference implementations (_demo_) are not counted as components, same as the menu. */
  protected readonly total = inject(ComponentCatalog).components.filter((c) => !c.reference).length;
  protected readonly sections = MAIN_SECTIONS;
}
