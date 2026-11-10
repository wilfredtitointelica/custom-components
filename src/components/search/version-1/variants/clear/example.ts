import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearch } from '../../base/search';

@Component({
  selector: 'search-clear-example',
  templateUrl: './example.html',
  imports: [IntSearch, FormsModule],
})
export class SearchClearExample {
  value = 'Fee Library';
}
