import { Component, signal } from '@angular/core';

import { IntSearchdropdown } from '../../base/searchdropdown';

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
  selector: 'searchdropdown-complete-on-focus-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown],
})
export class SearchdropdownCompleteOnFocusExample {
  protected readonly results = signal<readonly string[]>([]);

  // Empty text (the focus): the recent searches; with text, the matching fees.
  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(text ? FEES.filter((fee) => fee.toLowerCase().includes(text)) : [...RECENT]);
  }
}
