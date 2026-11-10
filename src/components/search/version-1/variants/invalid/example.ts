import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearch } from '../../base/search';

@Component({
  selector: 'search-invalid-example',
  templateUrl: './example.html',
  imports: [IntSearch, FormsModule],
})
export class SearchInvalidExample {
  value = 'Unknown';
}
