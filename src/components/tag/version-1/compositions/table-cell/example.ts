import { Component } from '@angular/core';

import { IntTag, IntTagSeverity } from '../../base/tag';

interface Row {
  readonly id: string;
  readonly status: string;
  readonly severity: IntTagSeverity;
}

const ROWS: readonly Row[] = [
  { id: 'TX-1024', status: 'Info', severity: 'info' },
  { id: 'TX-1025', status: 'Success', severity: 'success' },
  { id: 'TX-1026', status: 'Warning', severity: 'warn' },
];

@Component({
  selector: 'tag-table-cell-example',
  templateUrl: './example.html',
  imports: [IntTag],
})
export class TagTableCellExample {
  readonly rows = ROWS;
}
