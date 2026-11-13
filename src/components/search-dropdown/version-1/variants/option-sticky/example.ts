import { Component, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

interface Fee {
  name: string;
  sticky?: boolean;
}

const FEES: readonly Fee[] = [
  { name: 'Association Assessment' },
  { name: 'Authorization Services' },
  { name: 'Clearing and Settlement Services' },
  { name: 'Mandated Services' },
  { name: 'Optional Services' },
  { name: 'Pass-through Charges' },
  { name: 'Penalties' },
];

@Component({
  selector: 'search-dropdown-option-sticky-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownOptionStickyExample {
  protected readonly results = signal<Fee[]>([]);

  // The last suggestion is the fixed one: it stays at the bottom while the list scrolls.
  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set([...FEES.filter((fee) => fee.name.toLowerCase().includes(text)), { name: 'Explore all fees', sticky: true }]);
  }
}
