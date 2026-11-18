import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntInputText } from '../../base/inputtext';

@Component({
  selector: 'inputtext-validation-example',
  templateUrl: './example.html',
  imports: [IntInputText, ReactiveFormsModule],
})
export class InputtextValidationExample {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
}
