import { Component, inject } from '@angular/core';

import { IntConfirmationService, IntConfirmDialogModal } from '../../base/confirm-dialog-modal';

@Component({
  selector: 'confirm-dialog-modal-basic-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal],
})
export class ConfirmDialogModalBasicExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'basic',
      header: 'Confirmation',
      message: 'Are you sure you want to proceed?',
    });
  }
}
