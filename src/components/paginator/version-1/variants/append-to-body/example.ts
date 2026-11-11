import { Component, signal } from '@angular/core';

import { IntPaginator } from '../../base/paginator';

@Component({
  selector: 'paginator-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntPaginator],
})
export class PaginatorAppendToBodyExample {
  readonly firstClipped = signal(0);
  readonly rowsClipped = signal(10);
  readonly first = signal(0);
  readonly rows = signal(10);
}
