import { Component } from '@angular/core';

import { IntBreadcrumb, IntBreadcrumbItem } from '../../base/breadcrumb';

const HOME: IntBreadcrumbItem = { url: '#' };

const ITEMS: readonly IntBreadcrumbItem[] = [
  { label: 'Reports', url: '#' },
  { label: 'Fees', url: '#' },
  { label: 'Interchange', url: '#' },
  { label: 'Monthly summary' },
];

@Component({
  selector: 'breadcrumb-basic-example',
  templateUrl: './example.html',
  imports: [IntBreadcrumb],
})
export class BreadcrumbBasicExample {
  readonly home = HOME;
  readonly items = ITEMS;
}
