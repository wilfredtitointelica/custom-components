import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntConfirmationService, IntConfirmdialog } from '../../base/confirmdialog';

@Component({
  selector: 'confirmdialog-template-example',
  templateUrl: './example.html',
  imports: [IntConfirmdialog, IntButton],
})
export class ConfirmdialogTemplateExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'template',
      severity: 'success',
      header: 'Publication ready',
      message: 'Your file is ready to be shared with your team.',
    });
  }
}
