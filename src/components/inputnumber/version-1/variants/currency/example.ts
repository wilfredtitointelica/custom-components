import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/inputnumber';

@Component({
  selector: 'inputnumber-currency-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputnumberCurrencyExample {
  fee: number | null = 1234567.891;
}
