import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/inputnumber';

@Component({
  selector: 'inputnumber-basic-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputnumberBasicExample {
  rate: number | null = 0.0125;
}
