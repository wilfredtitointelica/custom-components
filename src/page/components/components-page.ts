import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ComponentNav } from './component-nav/component-nav';

/** Catalog shell: side menu (drawer on small screens) + documentation outlet. */
@Component({
  selector: 'app-components-page',
  imports: [RouterOutlet, ComponentNav],
  templateUrl: './components-page.html',
  styleUrl: './components-page.scss',
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
})
export class ComponentsPage {
  protected readonly drawerOpen = signal(false);
}
