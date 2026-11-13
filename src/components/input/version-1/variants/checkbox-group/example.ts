import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-group-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class InputCheckboxGroupExample {
  readonly brands = [
    { name: 'Visa', code: 'VI' },
    { name: 'Mastercard', code: 'MC' },
    { name: 'American Express', code: 'AX' },
    { name: 'Diners Club', code: 'DC', inactive: true },
    { name: 'Discover', code: 'DI' },
  ];
  selected: string[] = ['VI', 'MC'];
}
