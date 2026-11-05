import { Component, signal } from '@angular/core';

import { IntPaginator, IntPaginatorPageChangeEvent } from '../../base/paginator';

@Component({
  selector: 'paginator-basic-example',
  templateUrl: './example.html',
  imports: [IntPaginator],
})
export class PaginatorBasicExample {
  readonly first = signal(0);
  readonly rows = signal(10);

  onPageChange(event: IntPaginatorPageChangeEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }
}
