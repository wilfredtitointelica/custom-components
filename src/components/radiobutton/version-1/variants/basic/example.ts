import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntRadioButton } from '../../base/radiobutton';

@Component({
  selector: 'radiobutton-basic-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, FormsModule],
})
export class RadiobuttonBasicExample {
  readonly feeTypes = [
    { code: 'fixed', label: 'Fixed' },
    { code: 'percentage', label: 'Percentage' },
    { code: 'mixed', label: 'Fixed + percentage' },
  ];
  feeType = 'percentage';
}
