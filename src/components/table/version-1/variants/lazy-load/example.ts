import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../../../inputnumber/version-1/base/inputnumber';
import { IntSelect } from '../../../../select/version-1/base/select';
import { IntSortableColumn, IntSortIcon, IntTable, IntTableLazyLoadEvent } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: number;
}

const NAMES = ['Acquirer Processing Fee', 'Cross Border Assessment', 'International Service Assessment', 'Network Access Fee'];
const REGIONS = ['LAC', 'NA', 'EU', 'AP'];
const PAGE_SIZES: readonly number[] = [10, 20, 50];

/** Stands in for the backend: 200 fees that are never sent to the table at once. */
const SERVER_FEES: readonly Fee[] = Array.from({ length: 200 }, (_, index) => ({
  code: `FE-${1001 + index}`,
  name: NAMES[index % NAMES.length],
  region: REGIONS[index % REGIONS.length],
  amount: 1250 + index * 437.5,
}));

@Component({
  selector: 'table-lazy-load-example',
  templateUrl: './example.html',
  imports: [FormsModule, IntTable, IntSortableColumn, IntSortIcon, IntSelect, IntInputNumber, DecimalPipe],
})
export class TableLazyLoadExample {
  protected readonly pageSizes = PAGE_SIZES;

  // Page bound with [(first)] / [(rows)]: each change makes the table emit onLazyLoad.
  protected readonly first = signal(0);
  protected readonly rows = signal(10);

  /** Rows of the page the "backend" returned, and the total it reports. */
  protected readonly page = signal<Fee[]>([]);
  protected readonly total = signal(0);

  /** Last sort the table asked for, reused when the page changes from paginatorleft. */
  private sortField: string | null = null;
  private sortOrder = 1;

  /** What a real project does with the event: ask the API for that page, sorted, and show what it returns. */
  protected load(event: IntTableLazyLoadEvent): void {
    this.sortField = event.sortField;
    this.sortOrder = event.sortOrder;
    this.fetch(event.first, event.rows);
  }

  protected selectRowsPerPage(size: number): void {
    this.rows.set(size);
    this.first.set(0);
    this.fetch(0, size);
  }

  /** int-inputnumber clamps to min / max on blur; while typing, only whole pages in range are applied. */
  protected onPageSelect(page: number | null, pageCount: number): void {
    if (page != null && Number.isInteger(page) && page >= 1 && page <= pageCount) {
      const first = (page - 1) * this.rows();
      this.first.set(first);
      this.fetch(first, this.rows());
    }
  }

  /** Stands in for the HTTP call: sorts and slices on the "server". */
  private fetch(first: number, rows: number): void {
    const sorted = [...SERVER_FEES];
    const field = this.sortField as keyof Fee | null;
    if (field) sorted.sort((a, b) => this.sortOrder * (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0));
    this.page.set(sorted.slice(first, first + rows));
    this.total.set(SERVER_FEES.length);
  }
}
