import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntSearchdropdown } from '../../base/searchdropdown';

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
  selector: 'searchdropdown-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown, IntButton],
})
export class SearchdropdownAvoidElementsExample {
  protected readonly results = signal<string[]>([]);

  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(FEES.filter((fee) => fee.toLowerCase().includes(text)));
  }
}
