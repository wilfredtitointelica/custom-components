import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntMessage } from '../../../../message/version-1/base/message';
import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-helper-text-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule, IntMessage],
})
export class PasswordHelperTextExample {
  value = '';
}
