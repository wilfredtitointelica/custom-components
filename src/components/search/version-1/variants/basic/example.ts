import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearch } from '../../base/search';

@Component({
  selector: 'search-basic-example',
  templateUrl: './example.html',
  imports: [IntSearch, FormsModule],
})
export class SearchBasicExample {
  value = '';
  readonly lastSearch = signal('');
}
