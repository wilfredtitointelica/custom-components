import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/input-number';

@Component({
  selector: 'input-number-prefix-suffix-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputNumberPrefixSuffixExample {
  percentage: number | null = 42.5;
  txn: number | null = 128000;
}
