import { Component, signal } from '@angular/core';

import { IntSearchdropdown } from '../../base/searchdropdown';

const FEES: readonly string[] = [
  'Authorization Services',
  'Clearing and Settlement Services',
  'Mandated Services',
  'Optional Services',
  'Penalties',
];

@Component({
  selector: 'searchdropdown-sizes-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown],
})
export class SearchdropdownSizesExample {
  protected readonly results = signal<string[]>([]);

  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(FEES.filter((fee) => fee.toLowerCase().includes(text)));
  }
}
