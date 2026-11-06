import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-disabled-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordDisabledExample {
  value = 'Password1';
}
