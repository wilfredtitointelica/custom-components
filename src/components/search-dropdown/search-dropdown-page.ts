import { Component } from '@angular/core';

import { DocPage } from '../../core/doc-page/doc-page';

/**
 * Documentation page of "Search Dropdown".
 * Sections come from <id>.config.ts + the version-N/variants/<slug>/ folders, which are detected
 * automatically: nothing is registered here. Optional intro content goes inside <app-doc-page>.
 */
@Component({
  selector: 'app-search-dropdown-page',
  imports: [DocPage],
  template: `<app-doc-page componentId="search-dropdown" />`,
})
export class SearchDropdownPage {}
