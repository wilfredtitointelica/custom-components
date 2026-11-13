import { Component, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

const FEES: readonly string[] = [
  'Authorization Services',
  'Clearing and Settlement Services',
  'Mandated Services',
  'Optional Services',
  'Penalties',
];

@Component({
  selector: 'search-dropdown-sizes-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownSizesExample {
  protected readonly results = signal<string[]>([]);

  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(FEES.filter((fee) => fee.toLowerCase().includes(text)));
  }
}
