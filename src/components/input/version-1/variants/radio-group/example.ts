import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntRadioButton } from '../../base/radio-button';

@Component({
  selector: 'input-radio-group-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, FormsModule],
})
export class InputRadioGroupExample {
  readonly feeTypes = [
    { code: 'fixed', label: 'Fixed' },
    { code: 'percentage', label: 'Percentage' },
    { code: 'mixed', label: 'Fixed + percentage' },
  ];
  feeType = 'percentage';
}
