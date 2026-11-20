import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../../../inputnumber/version-1/base/inputnumber';
import { IntSelect } from '../../../../select/version-1/base/select';
import { IntSortableColumn, IntSortIcon, IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: number;
}

const NAMES = ['Acquirer Processing Fee', 'Cross Border Assessment', 'International Service Assessment', 'Network Access Fee'];
const REGIONS = ['LAC', 'NA', 'EU', 'AP'];
const PAGE_SIZES: readonly number[] = [10, 20, 50];

/** 50 fees loaded at once: the table pages them in the browser. */
const FEES: readonly Fee[] = Array.from({ length: 50 }, (_, index) => ({
  code: `FE-${1001 + index}`,
  name: NAMES[index % NAMES.length],
  region: REGIONS[index % REGIONS.length],
  amount: 1250 + index * 437.5,
}));

@Component({
  selector: 'table-paginator-example',
  templateUrl: './example.html',
  imports: [FormsModule, IntTable, IntSortableColumn, IntSortIcon, IntSelect, IntInputNumber, DecimalPipe],
})
export class TablePaginatorExample {
  protected readonly fees = FEES;
  protected readonly pageSizes = PAGE_SIZES;

  // Page bound with [(first)] / [(rows)]: the table also moves it when it sorts or filters.
  protected readonly first = signal(0);
  protected readonly rows = signal(10);

  protected selectRowsPerPage(size: number): void {
    this.rows.set(size);
    this.first.set(0);
  }

  /** int-inputnumber clamps to min / max on blur; while typing, only whole pages in range are applied. */
  protected onPageSelect(page: number | null, pageCount: number): void {
    if (page != null && Number.isInteger(page) && page >= 1 && page <= pageCount) {
      this.first.set((page - 1) * this.rows());
    }
  }
}
