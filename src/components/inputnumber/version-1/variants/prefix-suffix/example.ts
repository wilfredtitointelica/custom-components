import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/inputnumber';

@Component({
  selector: 'inputnumber-prefix-suffix-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputnumberPrefixSuffixExample {
  percentage: number | null = 42.5;
  txn: number | null = 128000;
}
