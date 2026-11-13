import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntMultiselect } from '../../base/multiselect';

interface City {
  name: string;
  code: string;
}

const CITIES: readonly City[] = [
  { name: 'New York', code: 'NY' },
  { name: 'Rome', code: 'RM' },
  { name: 'London', code: 'LDN' },
  { name: 'Istanbul', code: 'IST' },
  { name: 'Paris', code: 'PRS' },
];

@Component({
  selector: 'multiselect-fluid-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
  // The preview centers the example: the host takes the full width so fluid has a width to fill.
  host: { class: 'u-full-width' },
})
export class MultiselectFluidExample {
  readonly cities = CITIES;
  selected: City[] = [];
}
