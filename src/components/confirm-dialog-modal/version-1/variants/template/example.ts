import { Component, inject } from '@angular/core';

import { IntConfirmationService, IntConfirmDialogModal } from '../../base/confirm-dialog-modal';

@Component({
  selector: 'confirm-dialog-modal-template-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal],
})
export class ConfirmDialogModalTemplateExample {
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
