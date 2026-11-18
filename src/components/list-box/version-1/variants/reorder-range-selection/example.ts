import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntListBox } from '../../base/list-box';

@Component({
  selector: 'list-box-reorder-range-selection-example',
  templateUrl: './example.html',
  imports: [IntListBox, FormsModule],
})
export class ListBoxReorderRangeSelectionExample {
  /** Reordered in place by dragdrop, as PrimeNG. */
  readonly columns = ['Fee name', 'Fee code', 'Region', 'Brand', 'Amount USD', 'Effective date'];
  selected: string[] = [];
  readonly last = signal('Drag an option to reorder');
}
