import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearchDropdown } from '../../base/search-dropdown';

interface Section {
  label: string;
  items: string[];
}

@Component({
  selector: 'search-dropdown-recent-searches-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown, FormsModule],
  // TODO(dep:button provisional): no helper removes the native border and background of a button; int-button replaces it.
  styles: `
    button[data-dep='button'] {
      border: 0;
      background: none;
    }
  `,
})
export class SearchDropdownRecentSearchesExample {
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
