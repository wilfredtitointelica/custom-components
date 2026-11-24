import { Component } from '@angular/core';

import { IntSearch } from '../../base/search';

@Component({
  selector: 'search-fluid-example',
  templateUrl: './example.html',
  imports: [IntSearch],
  // The preview centers the example: the host takes the full width so fluid has a width to fill.
  host: { class: 'u-full-width' },
})
export class SearchFluidExample {}
