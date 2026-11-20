import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntConfirmationService, IntConfirmdialog } from '../../base/confirmdialog';

@Component({
  selector: 'confirmdialog-only-accept-example',
  templateUrl: './example.html',
  imports: [IntConfirmdialog, IntButton],
})
export class ConfirmdialogOnlyAcceptExample {
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
