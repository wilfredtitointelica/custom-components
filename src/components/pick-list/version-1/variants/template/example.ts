import { Component } from '@angular/core';

import { IntPickList } from '../../base/pick-list';

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
  selector: 'pick-list-template-example',
  templateUrl: './example.html',
  imports: [IntPickList],
})
export class PickListTemplateExample {
  source: Page[] = PAGES.slice(0, 3);
  target: Page[] = PAGES.slice(3);
}
