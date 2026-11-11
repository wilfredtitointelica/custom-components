import { Component, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

const FEES: readonly string[] = [
  'Authorization Services',
  'Clearing and Settlement Services',
  'Data Integrity Monitoring Program',
  'Issuer Volume - Visa Domestic',
  'Mandated Services',
  'Optional Services',
  'Pass-through Charges',
  'Penalties',
];

@Component({
  selector: 'search-dropdown-basic-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownBasicExample {
  protected readonly results = signal<string[]>([]);
  protected readonly last = signal('');

  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(FEES.filter((fee) => fee.toLowerCase().includes(text)));
  }
}
