import { Component, inject } from '@angular/core';

import { IntConfirmationService, IntConfirmDialogModal } from '../../base/confirm-dialog-modal';

@Component({
  selector: 'confirm-dialog-modal-only-accept-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal],
})
export class ConfirmDialogModalOnlyAcceptExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'only-accept',
      severity: 'success',
      header: 'All changes saved',
      message: 'Your changes were saved successfully.',
      acceptLabel: 'Ok',
      rejectVisible: false,
    });
  }
}
