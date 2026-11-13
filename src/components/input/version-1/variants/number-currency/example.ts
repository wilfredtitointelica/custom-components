import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/input-number';

@Component({
  selector: 'input-number-currency-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputNumberCurrencyExample {
  fee: number | null = 1234567.891;
}
