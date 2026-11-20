import { Component } from '@angular/core';

import { IntPicklist } from '../../base/picklist';

interface Page {
  name: string;
  module: string;
  icon: string;
}

const PAGES: readonly Page[] = [
  { name: 'Fee Library', module: 'Fee', icon: 'icon-bookmark' },
  { name: 'Original Invoice', module: 'Billing', icon: 'icon-file' },
  { name: 'Penalty Summary', module: 'Penalties', icon: 'icon-chart' },
  { name: 'Fee Dashboard', module: 'Fee', icon: 'icon-dashboards' },
];

@Component({
  selector: 'picklist-template-example',
  templateUrl: './example.html',
  imports: [IntPicklist],
})
export class PicklistTemplateExample {
  source: Page[] = PAGES.slice(0, 3);
  target: Page[] = PAGES.slice(3);
}
