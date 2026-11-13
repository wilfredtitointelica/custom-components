import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-validation-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, ReactiveFormsModule],
})
export class InputCheckboxValidationExample {
  readonly terms = new FormControl(false, Validators.requiredTrue);
}
