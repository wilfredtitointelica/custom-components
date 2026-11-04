import { Component, signal } from '@angular/core';

import { IntBreadcrumb, IntBreadcrumbItem } from '../../base/breadcrumb';

const HOME: IntBreadcrumbItem = { routerLink: '/' };

const ITEMS: readonly IntBreadcrumbItem[] = [
  { label: 'Components', routerLink: '/components' },
  { label: 'Navigation', command: () => undefined },
  { label: 'Breadcrumb', routerLink: '/components/breadcrumb', fragment: 'breadcrumb-router' },
];

@Component({
  selector: 'breadcrumb-router-example',
  templateUrl: './example.html',
  imports: [IntBreadcrumb],
})
export class BreadcrumbRouterExample {
  readonly home = HOME;
  readonly items = ITEMS;
  /** Label of the last clicked item, from onItemClick. */
  readonly lastClicked = signal('—');
}
