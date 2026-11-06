import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-success-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule],
})
export class InputotpSuccessExample {
  value = '1234';
}
