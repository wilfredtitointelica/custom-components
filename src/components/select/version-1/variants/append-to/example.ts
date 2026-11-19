import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSelect } from '../../base/select';

@Component({
  selector: 'select-append-to-example',
  templateUrl: './example.html',
  imports: [IntSelect, FormsModule],
})
export class SelectAppendToExample {
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
