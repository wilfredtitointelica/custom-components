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
  selector: 'multiselect-selected-items-label-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectSelectedItemsLabelExample {
  readonly brands = BRANDS;
  selected: number[] = [];

  /** Empty without selection: the component already shows the placeholder. */
  get selectionLabel(): string {
    if (!this.selected.length) return '';
    if (this.selected.length === this.brands.length) return 'All Brands';
    if (this.selected.length === 1) return this.brands.find((brand) => brand.id === this.selected[0])?.name ?? '';
    return `${this.selected.length} brands selected`;
  }
}
