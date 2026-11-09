import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: number;
}

const NAMES = ['Acquirer Processing Fee', 'Cross Border Assessment', 'International Service Assessment', 'Network Access Fee'];
const REGIONS = ['LAC', 'NA', 'EU', 'AP'];

const FEES: readonly Fee[] = Array.from({ length: 15 }, (_, index) => ({
  code: `FE-${1001 + index}`,
  name: NAMES[index % NAMES.length],
  region: REGIONS[index % REGIONS.length],
  amount: 1250 + index * 437.5,
}));

@Component({
  selector: 'table-scroll-example',
  templateUrl: './example.html',
  imports: [IntTable, DecimalPipe],
})
export class TableScrollExample {
  protected readonly fees = FEES;
}
