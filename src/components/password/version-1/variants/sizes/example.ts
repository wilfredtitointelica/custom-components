import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-sizes-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
})
export class PasswordSizesExample {
  small = '';
  normal = '';
  large = '';
}
