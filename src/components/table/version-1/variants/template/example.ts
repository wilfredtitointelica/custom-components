import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IntTable } from '../../base/table';
import { IntSearch } from '../../../../search/version-1/base/search';

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
  imports: [IntTable, IntSearch, FormsModule, DecimalPipe],
})
export class TableTemplateExample {
  protected readonly fees = FEES;
  /** Text of the search field in the caption. */
  protected readonly searchText = signal('');
}
