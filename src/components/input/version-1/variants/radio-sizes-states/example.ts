import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntRadioButton } from '../../base/radio-button';

@Component({
  selector: 'input-radio-sizes-states-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, FormsModule],
})
export class InputRadioSizesStatesExample {}
