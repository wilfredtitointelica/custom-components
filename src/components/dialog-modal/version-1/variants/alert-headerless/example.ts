import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialogModal } from '../../base/dialog-modal';

@Component({
  selector: 'dialog-modal-alert-headerless-example',
  templateUrl: './example.html',
  imports: [IntDialogModal, IntButton],
})
export class DialogModalAlertHeaderlessExample {
  readonly visible = signal(false);
}
