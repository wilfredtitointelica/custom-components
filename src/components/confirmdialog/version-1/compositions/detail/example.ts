import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntConfirmationService, IntConfirmdialog } from '../../base/confirmdialog';

@Component({
  selector: 'confirmdialog-detail-example',
  templateUrl: './example.html',
  imports: [IntConfirmdialog, IntButton],
})
export class ConfirmdialogDetailExample {
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
