import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../../../dropdown-select/version-1/base/dropdown-select';
import { IntInputNumber } from '../../../../input/version-1/base/input-number';
import { IntPaginator, IntPaginatorPageChangeEvent } from '../../base/paginator';

const PAGE_SIZES: readonly number[] = [10, 20, 50, 100];

@Component({
  selector: 'paginator-table-paginator-example',
  templateUrl: './example.html',
  imports: [FormsModule, IntPaginator, IntDropdownSelect, IntInputNumber],
})
export class PaginatorTablePaginatorExample {
  readonly totalRecords = 50;
  readonly pageSizes = PAGE_SIZES;
  readonly rowsPerPage = signal(10);
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.totalRecords / this.rowsPerPage()));

  onPageChange(event: IntPaginatorPageChangeEvent): void {
    this.currentPage.set(event.page + 1);
  }

  selectRowsPerPage(size: number): void {
    this.rowsPerPage.set(size);
    this.currentPage.set(1);
  }

  /** int-inputnumber clamps to min / max on blur; while typing, only whole pages in range are applied. */
  onPageSelect(page: number | null): void {
    if (page != null && Number.isInteger(page) && page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }
}
