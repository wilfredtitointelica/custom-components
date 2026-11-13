import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

const FEES: readonly string[] = [
  'Authorization Services',
  'Clearing and Settlement Services',
  'Data Integrity Monitoring Program',
  'Mandated Services',
  'Optional Services',
  'Penalties',
];

@Component({
  selector: 'search-dropdown-loading-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownLoadingExample {
  protected readonly results = signal<string[]>([]);
  private timeout?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
  }

  // Simulates a slow service: the skeleton stays until the new suggestions are assigned.
  protected search(query: string): void {
    clearTimeout(this.timeout);
    const text = query.toLowerCase();
    this.timeout = setTimeout(() => this.results.set(FEES.filter((fee) => fee.toLowerCase().includes(text))), 1500);
  }
}
