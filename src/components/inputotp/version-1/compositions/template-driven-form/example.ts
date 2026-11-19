import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { IntButtonElement } from '../../../../button/version-1/base/button-element';
import { IntMessage } from '../../../../message/version-1/base/message';
import { IntInputotp } from '../../base/inputotp';

@Component({
  selector: 'inputotp-template-driven-form-example',
  templateUrl: './example.html',
  imports: [IntInputotp, FormsModule, IntButtonElement, IntMessage],
})
export class InputotpTemplateDrivenFormExample {
  value = '';

  // A valid code is accepted and the form goes back to its initial state.
  onSubmit(form: NgForm): void {
    if (form.valid) form.resetForm();
  }
}
