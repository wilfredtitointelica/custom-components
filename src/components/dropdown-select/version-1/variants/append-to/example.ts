import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

@Component({
  selector: 'dropdown-select-append-to-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, FormsModule],
})
export class DropdownSelectAppendToExample {
  city: unknown = null;
  city2: unknown = null;
  readonly cities = [
    { name: 'Lima', code: 'LIM' },
    { name: 'Bogotá', code: 'BOG' },
    { name: 'Santiago', code: 'SCL' },
    { name: 'Quito', code: 'UIO' },
    { name: 'Buenos Aires', code: 'BUE' },
  ];
}
