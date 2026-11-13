import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialogModal } from '../../base/dialog-modal';

@Component({
  selector: 'dialog-modal-confirmation-example',
  templateUrl: './example.html',
  imports: [IntDialogModal, IntButton],
})
export class DialogModalConfirmationExample {
  readonly visible = signal(false);
}
