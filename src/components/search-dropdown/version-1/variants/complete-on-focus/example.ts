import { Component, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

const RECENT: readonly string[] = ['Data Integrity Monitoring Program', 'Mandated Services', 'Penalties'];

const FEES: readonly string[] = [
  'Authorization Services',
  'Clearing and Settlement Services',
  'Data Integrity Monitoring Program',
  'Mandated Services',
  'Optional Services',
  'Penalties',
];

@Component({
  selector: 'search-dropdown-complete-on-focus-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownCompleteOnFocusExample {
  protected readonly results = signal<readonly string[]>([]);

  // Empty text (the focus): the recent searches; with text, the matching fees.
  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(text ? FEES.filter((fee) => fee.toLowerCase().includes(text)) : [...RECENT]);
  }
}
