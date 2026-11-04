import { Component } from '@angular/core';

import { IntBreadcrumb, IntBreadcrumbItem } from '../../base/breadcrumb';

const HOME: IntBreadcrumbItem = { icon: 'icon icon-home icon--sm' };

const ITEMS: readonly IntBreadcrumbItem[] = [
  { icon: 'icon icon-folder icon--sm', label: 'Files' },
  { icon: 'icon icon-chart icon--sm', label: 'Dashboards' },
  { icon: 'icon icon-file icon--sm', label: 'Fee report' },
];

@Component({
  selector: 'breadcrumb-template-example',
  templateUrl: './example.html',
  imports: [IntBreadcrumb],
})
export class BreadcrumbTemplateExample {
  readonly home = HOME;
  readonly items = ITEMS;
}
