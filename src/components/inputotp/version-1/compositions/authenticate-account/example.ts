import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButtonElement } from '../../../../button/version-1/base/button-element';
import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-authenticate-account-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule, IntButtonElement],
})
export class InputotpAuthenticateAccountExample {
  value = '';
}
