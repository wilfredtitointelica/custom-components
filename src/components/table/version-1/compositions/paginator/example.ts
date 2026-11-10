import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IntTable } from '../../base/table';
import { IntPaginator, IntPaginatorPageChangeEvent } from '../../../../paginator/version-1/base/paginator';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: number;
}

const NAMES = ['Acquirer Processing Fee', 'Cross Border Assessment', 'International Service Assessment', 'Network Access Fee'];
const REGIONS = ['LAC', 'NA', 'EU', 'AP'];

const FEES: readonly Fee[] = Array.from({ length: 50 }, (_, index) => ({
  code: `FE-${1001 + index}`,
  name: NAMES[index % NAMES.length],
  region: REGIONS[index % REGIONS.length],
  amount: 1250 + index * 437.5,
}));

@Component({
  selector: 'table-paginator-example',
  templateUrl: './example.html',
  imports: [IntTable, IntPaginator, DecimalPipe],
})
export class TablePaginatorExample {
  protected readonly fees = FEES;
  protected readonly first = signal(0);
  protected readonly rows = signal(10);
  /** Rows of the current page: what the backend would return for that page. */
  protected readonly pageFees = computed(() => FEES.slice(this.first(), this.first() + this.rows()));

  protected onPageChange(event: IntPaginatorPageChangeEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }
}
