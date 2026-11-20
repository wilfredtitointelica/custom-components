import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntListbox } from '../../base/listbox';

@Component({
  selector: 'listbox-reorder-range-selection-example',
  templateUrl: './example.html',
  imports: [IntListbox, FormsModule],
})
export class ListboxReorderRangeSelectionExample {
  /** Reordered in place by dragdrop, as PrimeNG. */
  readonly columns = ['Fee name', 'Fee code', 'Region', 'Brand', 'Amount USD', 'Effective date'];
  selected: string[] = [];
  readonly last = signal('Drag an option to reorder');
}
