import { Component } from '@angular/core';

import { IntPicklist } from '../../base/picklist';

interface Page {
  name: string;
  module: string;
}

const PAGES: readonly Page[] = [
  { name: 'Fee Library', module: 'Fee' },
  { name: 'Fee Dashboard', module: 'Fee' },
  { name: 'Original Invoice', module: 'Billing' },
  { name: 'Penalty Summary', module: 'Penalties' },
  { name: 'File Sharing', module: 'Files' },
];

@Component({
  selector: 'picklist-filter-example',
  templateUrl: './example.html',
  imports: [IntPicklist],
})
export class PicklistFilterExample {
  source: Page[] = [...PAGES];
  target: Page[] = [];
}
