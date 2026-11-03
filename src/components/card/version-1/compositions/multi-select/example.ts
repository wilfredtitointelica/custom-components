import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface Item {
  id: string;
  title: string;
  description: string;
  disabled: boolean;
}

const ITEMS: readonly Item[] = [
  { id: 'fees', title: 'Fee report', description: 'Monthly fees by brand', disabled: false },
  { id: 'volume', title: 'Volume', description: 'Transactions by region', disabled: false },
  { id: 'archive', title: 'Archive', description: 'Reports from last year', disabled: true },
];

@Component({
  selector: 'card-multi-select-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardMultiSelectExample {
  readonly items = ITEMS;
  /** Ids of the pressed cards: each card toggles on its own. */
  readonly selected = signal<ReadonlySet<string>>(new Set(['fees']));

  toggle(id: string): void {
    this.selected.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}
