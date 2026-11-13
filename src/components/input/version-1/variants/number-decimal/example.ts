import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/input-number';

@Component({
  selector: 'input-number-decimal-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputNumberDecimalExample {
  rate: number | null = 0.0125;
}
