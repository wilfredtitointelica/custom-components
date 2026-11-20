import { Component, signal } from '@angular/core';

import { IntSearchdropdown } from '../../base/searchdropdown';

interface Entry {
  name: string;
}

interface Section {
  label: string;
  items: Entry[];
}

const SECTIONS: readonly Section[] = [
  {
    label: 'Fees',
    items: [{ name: 'Authorization Services' }, { name: 'Clearing and Settlement Services' }, { name: 'Mandated Services' }],
  },
  {
    label: 'Reports',
    items: [{ name: 'Fee Group Summary' }, { name: 'Mastercard Issuer - Top 20 Fees' }, { name: 'Visa Issuer - Top 5 Fees' }],
  },
];

@Component({
  selector: 'searchdropdown-group-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown],
})
export class SearchdropdownGroupExample {
  protected readonly results = signal<Section[]>([]);

  protected search(query: string): void {
    const text = query.toLowerCase();
    this.results.set(
      SECTIONS.map((section) => ({ ...section, items: section.items.filter((item) => item.name.toLowerCase().includes(text)) })).filter(
        (section) => section.items.length,
      ),
    );
  }
}
