import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-fluid-example',
  templateUrl: './example.html',
  imports: [IntPassword, FormsModule],
  // The preview centers the example: the host takes the full width so fluid has a width to fill.
  host: { class: 'u-full-width' },
})
export class PasswordFluidExample {
  value = '';
}
