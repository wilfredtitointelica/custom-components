import { Component, signal } from '@angular/core';

import { IntSearchDropdown } from '../../base/search-dropdown';

@Component({
  selector: 'search-dropdown-empty-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown],
})
export class SearchDropdownEmptyExample {
  protected readonly results = signal<string[]>([]);
}
