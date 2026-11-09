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
  selector: 'multiselect-sizes-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectSizesExample {
  readonly cities = CITIES;
  small: City[] = [];
  normal: City[] = [];
  large: City[] = [];
}
