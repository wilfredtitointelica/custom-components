import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

interface Fee {
  name: string;
  banks: number;
}

const FEES: readonly Fee[] = [
  { name: 'Authorization Services', banks: 12 },
  { name: 'Clearing and Settlement Services', banks: 8 },
  { name: 'Data Integrity Monitoring Program', banks: 12 },
  { name: 'Mandated Services', banks: 5 },
  { name: 'Optional Services', banks: 3 },
];

@Component({
  selector: 'search-dropdown-template-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownTemplateExample {
  protected readonly results = signal<Fee[]>([]);
  private timeout?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
  }

  // Simulates a slow service: the itemSkeleton rows stay until the new suggestions are assigned.
  protected search(query: string): void {
    clearTimeout(this.timeout);
    const text = query.toLowerCase();
    this.timeout = setTimeout(() => this.results.set(FEES.filter((fee) => fee.name.toLowerCase().includes(text))), 1500);
  }
}
