import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-readonly-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordReadonlyExample {
  value = 'Password1';
}
