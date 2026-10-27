import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntRadioButton } from '../../base/radio-button';

@Component({
  selector: 'input-radio-reactive-forms-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, ReactiveFormsModule],
})
export class InputRadioReactiveFormsExample {
  readonly frequencies = ['Daily', 'Weekly', 'Monthly'];
  readonly frequency = new FormControl<string | null>(null, Validators.required);
}
