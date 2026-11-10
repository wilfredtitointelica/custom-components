import { Component } from '@angular/core';

import { IntTable } from '../../base/table';

interface Fee {
  name: string;
  region: string;
  amount: string;
}

const FEES: readonly Fee[] = [
  { name: 'Acquirer Processing Fee', region: 'LAC', amount: '12,450.00' },
  { name: 'Cross Border Assessment', region: 'NA', amount: '8,320.50' },
  { name: 'International Service Assessment', region: 'EU', amount: '15,780.25' },
  { name: 'Network Access Fee', region: 'AP', amount: '4,210.00' },
];

const TOTALS = [{ label: 'Total', amount: '40,760.75' }];

@Component({
  selector: 'table-frozen-rows-example',
  templateUrl: './example.html',
  imports: [IntTable],
})
export class TableFrozenRowsExample {
  protected readonly fees = FEES;
  protected readonly totals = TOTALS;
}
