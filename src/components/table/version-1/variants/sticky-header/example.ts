import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  amount: number;
}

const NAMES = ['Acquirer Processing Fee', 'Cross Border Assessment', 'International Service Assessment', 'Network Access Fee'];

const FEES: readonly Fee[] = Array.from({ length: 20 }, (_, index) => ({
  code: `FE-${1001 + index}`,
  name: NAMES[index % NAMES.length],
  amount: 1250 + index * 437.5,
}));

const TOTALS = [{ label: 'Total', amount: FEES.reduce((sum, fee) => sum + fee.amount, 0) }];

@Component({
  selector: 'table-sticky-header-example',
  templateUrl: './example.html',
  imports: [IntTable, DecimalPipe],
})
export class TableStickyHeaderExample {
  protected readonly fees = FEES;
  protected readonly totals = TOTALS;
}
