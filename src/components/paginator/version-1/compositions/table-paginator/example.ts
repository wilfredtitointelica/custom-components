import { Component, computed, ElementRef, inject, signal } from '@angular/core';

import { IntPaginator, IntPaginatorPageChangeEvent } from '../../base/paginator';

const PAGE_SIZES: readonly number[] = [10, 20, 50, 100];

@Component({
  selector: 'paginator-table-paginator-example',
  templateUrl: './example.html',
  imports: [IntPaginator],
  // TODO(dep:dropdown-select provisional) a press outside the rows per page list closes it.
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class PaginatorTablePaginatorExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly totalRecords = 50;
  readonly rowsPerPage = signal(10);
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.totalRecords / this.rowsPerPage()));

  // TODO(dep:dropdown-select provisional) open state and options of the rows per page list.
  readonly rowsOpen = signal(false);
  /** The list shows the sizes that are not selected, as in the design. */
  readonly otherPageSizes = computed(() => PAGE_SIZES.filter((size) => size !== this.rowsPerPage()));

  onPageChange(event: IntPaginatorPageChangeEvent): void {
    this.currentPage.set(event.page + 1);
  }

  toggleRows(): void {
    this.rowsOpen.update((open) => !open);
  }

  /** Same keys as p-select on its trigger: Enter, Space and the arrows open; Escape closes. */
  onRowsTriggerKeydown(event: KeyboardEvent): void {
    if (['Enter', ' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.rowsOpen.set(true);
      // The list is created in this change detection; focus its first option once it is in the DOM.
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[role="option"]')?.focus());
    } else if (event.key === 'Escape') {
      this.rowsOpen.set(false);
    }
  }

  selectRowsPerPage(size: number, trigger: HTMLElement): void {
    this.rowsPerPage.set(size);
    this.currentPage.set(1);
    this.closeRows(trigger);
  }

  closeRows(trigger: HTMLElement): void {
    this.rowsOpen.set(false);
    trigger.focus();
  }

  onDocumentPointerDown(event: PointerEvent): void {
    const list = this.host.nativeElement.querySelector('[data-dep="dropdown-select"]');
    if (this.rowsOpen() && !list?.contains(event.target as Node)) this.rowsOpen.set(false);
  }

  // TODO(dep:input provisional) the number input of int-input will clamp the value itself.
  onPageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = Math.min(Math.max(Number(input.value) || 1, 1), this.totalPages());
    this.currentPage.set(page);
    input.value = String(page);
  }
}
