import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntRadioButton } from '../../base/radiobutton';

@Component({
  selector: 'radiobutton-reactive-forms-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, ReactiveFormsModule],
})
export class RadiobuttonReactiveFormsExample {
  readonly frequencies = ['Daily', 'Weekly', 'Monthly'];
  readonly frequency = new FormControl<string | null>(null, Validators.required);
}
