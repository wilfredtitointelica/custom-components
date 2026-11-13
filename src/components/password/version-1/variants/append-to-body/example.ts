import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordAppendToBodyExample {
  valueClipped = '';
  value = '';
}
