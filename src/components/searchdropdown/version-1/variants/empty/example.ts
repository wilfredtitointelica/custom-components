import { Component, signal } from '@angular/core';

import { IntSearchdropdown } from '../../base/searchdropdown';

@Component({
  selector: 'searchdropdown-empty-example',
  templateUrl: './example.html',
  imports: [IntSearchdropdown],
})
export class SearchdropdownEmptyExample {
  protected readonly results = signal<string[]>([]);
}
