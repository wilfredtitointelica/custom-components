import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IntTable } from '../../base/table';

interface Fee {
  name: string;
  region: string;
  amount: number;
}

const FEES: readonly Fee[] = [
  { name: 'Acquirer Processing Fee', region: 'LAC', amount: 12450 },
  { name: 'Cross Border Assessment', region: 'NA', amount: 8320.5 },
  { name: 'International Service Assessment', region: 'EU', amount: 15780.25 },
];

@Component({
  selector: 'table-template-example',
  templateUrl: './example.html',
  imports: [IntTable, DecimalPipe],
})
export class TableTemplateExample {
  protected readonly fees = FEES;
}
