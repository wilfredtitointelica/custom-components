import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-helper-text-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordHelperTextExample {
  value = '';
}
