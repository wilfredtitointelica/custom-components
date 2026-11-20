import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntSearchdropdown } from '../../base/searchdropdown';

interface Section {
  label: string;
  items: string[];
}

@Component({
  selector: 'searchdropdown-recent-searches-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown, FormsModule, IntButton],
})
export class SearchdropdownRecentSearchesExample {
  protected query = '';
  protected readonly recents = signal<string[]>(['fee', 'Visa Risk Essentials', 'Mastercard rules 2026']);
  protected readonly results = signal<Section[]>([]);
  protected readonly last = signal('');

  // The recents that contain the text; an empty group closes the panel.
  protected filter(query: string): void {
    const text = query.toLowerCase();
    const items = this.recents().filter((term) => term.toLowerCase().includes(text));
    this.results.set(items.length ? [{ label: 'Recent', items }] : []);
  }

  // A searched term goes to the top of the recents, without duplicates.
  protected search(value: unknown): void {
    const term = String(value ?? '').trim();
    if (!term) return;
    this.recents.update((recents) => [term, ...recents.filter((recent) => recent !== term)]);
    this.last.set(`Search: ${term}`);
  }

  // The X removes the term without selecting the row.
  protected remove(event: Event, term: string): void {
    event.stopPropagation();
    this.recents.update((recents) => recents.filter((recent) => recent !== term));
    this.filter(this.query);
  }
}
