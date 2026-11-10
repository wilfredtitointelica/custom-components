import { Component } from '@angular/core';

import { IntTable } from '../../base/table';

interface Version {
  name: string;
  date: string;
  amount: string;
  /** The version in force: its row is marked as active. */
  current: boolean;
}

const VERSIONS: readonly Version[] = [
  { name: 'Version 3', date: '01 Jan, 2026', amount: '12,450.00', current: true },
  { name: 'Version 2', date: '01 Jul, 2025', amount: '11,980.00', current: false },
  { name: 'Version 1', date: '01 Jan, 2025', amount: '11,200.00', current: false },
];

@Component({
  selector: 'table-active-row-example',
  templateUrl: './example.html',
  imports: [IntTable],
})
export class TableActiveRowExample {
  protected readonly versions = VERSIONS;
}
