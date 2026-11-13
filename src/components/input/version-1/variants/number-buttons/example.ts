import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/input-number';

@Component({
  selector: 'input-number-buttons-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputNumberButtonsExample {
  qty: number | null = 3;
}
