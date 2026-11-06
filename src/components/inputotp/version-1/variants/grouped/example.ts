import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-grouped-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule],
})
export class InputotpGroupedExample {
  value = '';
}
