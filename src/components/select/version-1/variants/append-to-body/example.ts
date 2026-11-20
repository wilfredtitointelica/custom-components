import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSelect } from '../../base/select';

@Component({
  selector: 'select-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntSelect, FormsModule],
})
export class SelectAppendToBodyExample {
  city: unknown = null;
  cityClipped: unknown = null;
  readonly cities = [
    { name: 'Lima', code: 'LIM' },
    { name: 'Bogotá', code: 'BOG' },
    { name: 'Santiago', code: 'SCL' },
    { name: 'Quito', code: 'UIO' },
    { name: 'Buenos Aires', code: 'BUE' },
  ];
}
