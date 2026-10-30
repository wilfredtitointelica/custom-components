import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface MiniItem {
  id: string;
  title: string;
  description: string;
  label: string;
  date: string;
  disabled: boolean;
}

const ITEMS: readonly MiniItem[] = [
  { id: 'fees', title: 'Fee report', description: 'Monthly fees by brand', label: 'Updated:', date: 'Jan 12', disabled: false },
  { id: 'volume', title: 'Volume', description: 'Transactions by region', label: 'Updated:', date: 'Jan 10', disabled: false },
  { id: 'archive', title: 'Archive', description: 'Reports from last year', label: 'Updated:', date: 'Dec 31', disabled: true },
];

@Component({
  selector: 'card-mini-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardMiniExample {
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
