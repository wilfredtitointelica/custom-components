import { Component } from '@angular/core';

import { IntBreadcrumb, IntBreadcrumbItem } from '../../base/breadcrumb';

const HOME: IntBreadcrumbItem = { url: '#' };

const ITEMS: readonly IntBreadcrumbItem[] = [
  { label: 'Reports', url: '#' },
  { label: 'Fees', url: '#' },
  {
    title: 'Show hidden levels',
    items: [
      { label: 'Interchange', url: '#' },
      { label: 'Visa', url: '#' },
    ],
  },
  { label: 'Monthly summary' },
];

@Component({
  selector: 'breadcrumb-disabled-example',
  templateUrl: './example.html',
  imports: [IntBreadcrumb],
})
export class BreadcrumbDisabledExample {
  readonly home = HOME;
  readonly items = ITEMS;
}
