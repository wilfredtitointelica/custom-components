import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntConfirmationService, IntConfirmdialog } from '../../base/confirmdialog';

@Component({
  selector: 'confirmdialog-basic-example',
  templateUrl: './example.html',
  imports: [IntConfirmdialog, IntButton],
})
export class ConfirmdialogBasicExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'basic',
      header: 'Confirmation',
      message: 'Are you sure you want to proceed?',
    });
  }
}
