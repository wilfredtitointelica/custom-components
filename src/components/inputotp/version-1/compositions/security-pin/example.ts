import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-security-pin-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule],
})
export class InputotpSecurityPinExample {
  value = '';
}
