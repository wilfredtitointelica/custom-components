import { Component } from '@angular/core';

import { IntBreadcrumb, IntBreadcrumbItem } from '../../base/breadcrumb';

const ITEMS: readonly IntBreadcrumbItem[] = [
  { label: 'Reports', url: '#' },
  { label: 'Fees', url: '#' },
  {
    title: 'Show hidden levels',
    items: [
      { label: 'Interchange', url: '#' },
      { label: 'Visa', url: '#' },
      { label: 'Credit', url: '#' },
    ],
  },
  { label: 'Region', url: '#' },
  { label: 'Monthly summary' },
];

@Component({
  selector: 'breadcrumb-collapsed-example',
  templateUrl: './example.html',
  imports: [IntBreadcrumb],
})
export class BreadcrumbCollapsedExample {
  readonly items = ITEMS;
}
