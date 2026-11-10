import { Component } from '@angular/core';

import { IntPickList } from '../../base/pick-list';

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
  selector: 'pick-list-filter-example',
  templateUrl: './example.html',
  imports: [IntPickList],
})
export class PickListFilterExample {
  source: Page[] = [...PAGES];
  target: Page[] = [];
}
