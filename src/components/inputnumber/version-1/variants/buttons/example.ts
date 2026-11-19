import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/inputnumber';

@Component({
  selector: 'inputnumber-buttons-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputnumberButtonsExample {
  qty: number | null = 3;
}
