import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { IntMessageService, IntToast } from '../../../../toast/version-1/base/toast';
import { IntPassword } from '../../base/password';

@Component({
  selector: 'password-template-driven-form-example',
  templateUrl: './example.html',
  imports: [IntPassword, IntToast, FormsModule],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class PasswordTemplateDrivenFormExample {
  private readonly messageService = inject(IntMessageService);

  value = '';

  // Same as PrimeNG's demo: a valid password shows a success toast and the form goes back to its initial state.
  onSubmit(form: NgForm): void {
    if (!form.valid) return;
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Form Submitted', life: 3000 });
    form.resetForm();
  }
}
