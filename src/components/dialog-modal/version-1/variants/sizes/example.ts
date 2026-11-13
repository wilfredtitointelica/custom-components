import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialogModal, IntDialogModalSize } from '../../base/dialog-modal';

@Component({
  selector: 'dialog-modal-sizes-example',
  templateUrl: './example.html',
  imports: [IntDialogModal, IntButton],
})
export class DialogModalSizesExample {
  readonly sizes: IntDialogModalSize[] = ['sm', 'md', 'lg', 'xl'];
  /** Size of the open dialog (null = closed). */
  readonly openSize = signal<IntDialogModalSize | null>(null);
}
