import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntMultiselect } from '../../base/multiselect';

interface Item {
  label: string;
  value: number;
}

const ITEMS: readonly Item[] = Array.from({ length: 10000 }, (_, index) => ({ label: `Item #${index}`, value: index }));

@Component({
  selector: 'multiselect-virtual-scroll-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectVirtualScrollExample {
  readonly items = ITEMS;
  selected: number[] = [];
}
