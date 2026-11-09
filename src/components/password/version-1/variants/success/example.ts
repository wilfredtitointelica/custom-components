import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-success-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordSuccessExample {
  value = 'Password1';
}
