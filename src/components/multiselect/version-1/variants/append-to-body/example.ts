import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntMultiselect } from '../../base/multiselect';

interface Brand {
  id: number;
  name: string;
}

const BRANDS: readonly Brand[] = [
  { id: 1, name: 'Visa' },
  { id: 2, name: 'Mastercard' },
  { id: 3, name: 'American Express' },
  { id: 4, name: 'Discover' },
];

@Component({
  selector: 'multiselect-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectAppendToBodyExample {
  readonly brands = BRANDS;
  selectedClipped: number[] = [];
  selected: number[] = [];
}
