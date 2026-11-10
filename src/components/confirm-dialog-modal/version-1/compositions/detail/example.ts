import { Component, inject } from '@angular/core';

import { IntConfirmationService, IntConfirmDialogModal } from '../../base/confirm-dialog-modal';

@Component({
  selector: 'confirm-dialog-modal-detail-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal],
})
export class ConfirmDialogModalDetailExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'detail',
      severity: 'warning',
      header: 'Unsaved changes',
      message: 'You have changes that have not been saved.',
      detail: 'If you leave now, your changes will be lost.',
      acceptLabel: 'Leave',
      rejectLabel: 'Stay',
    });
  }
}
