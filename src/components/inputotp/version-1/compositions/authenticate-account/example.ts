import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-authenticate-account-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule],
})
export class InputotpAuthenticateAccountExample {
  value = '';
}
