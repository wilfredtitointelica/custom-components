import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-meter-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordMeterExample {
  value = '';
}
