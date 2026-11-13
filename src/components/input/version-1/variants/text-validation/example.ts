import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntInputText } from '../../base/input-text';

@Component({
  selector: 'input-text-validation-example',
  templateUrl: './example.html',
  imports: [IntInputText, ReactiveFormsModule],
})
export class InputTextValidationExample {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
}
