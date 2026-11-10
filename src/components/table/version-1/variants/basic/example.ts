import { Component } from '@angular/core';

import { IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: string;
}

const FEES: readonly Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', region: 'LAC', amount: '12,450.00' },
  { code: 'MC-2045', name: 'Cross Border Assessment', region: 'NA', amount: '8,320.50' },
  { code: 'VI-1120', name: 'International Service Assessment', region: 'EU', amount: '15,780.25' },
  { code: 'AX-3010', name: 'Network Access Fee', region: 'AP', amount: '4,210.00' },
  { code: 'MC-2210', name: 'Digital Enablement Fee', region: 'LAC', amount: '6,905.75' },
];

@Component({
  selector: 'table-basic-example',
  templateUrl: './example.html',
  imports: [IntTable],
})
export class TableBasicExample {
  protected readonly fees = FEES;
}
