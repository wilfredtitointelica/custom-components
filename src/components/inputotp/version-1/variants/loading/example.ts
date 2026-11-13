import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-loading-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule],
})
export class InputotpLoadingExample {
  value = '123456';
}
