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
  selector: 'multiselect-clear-icon-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectClearIconExample {
  readonly cities = CITIES;
  selected: City[] = [CITIES[0], CITIES[1]];
}
