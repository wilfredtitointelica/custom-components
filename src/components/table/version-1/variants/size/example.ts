import { Component } from '@angular/core';

import { IntTable, IntTableSize } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  amount: string;
}

const FEES: readonly Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', amount: '12,450.00' },
  { code: 'MC-2045', name: 'Cross Border Assessment', amount: '8,320.50' },
  { code: 'VI-1120', name: 'International Service Assessment', amount: '15,780.25' },
];

const SIZES: readonly { label: string; value: IntTableSize | undefined }[] = [
  { label: 'Normal', value: undefined },
  { label: 'Small', value: 'small' },
];

@Component({
  selector: 'table-size-example',
  templateUrl: './example.html',
  imports: [IntTable],
})
export class TableSizeExample {
  protected readonly fees = FEES;
  protected readonly sizes = SIZES;
}
