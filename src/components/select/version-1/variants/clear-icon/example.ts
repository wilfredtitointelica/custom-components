import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSelect } from '../../base/select';

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
  selector: 'select-clear-icon-example',
  templateUrl: './example.html',
  imports: [IntSelect, FormsModule],
})
export class SelectClearIconExample {
  readonly cities = CITIES;
  selected: City | null = CITIES[0];
}
