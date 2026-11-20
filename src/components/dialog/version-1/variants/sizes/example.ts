import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialog, IntDialogSize } from '../../base/dialog';

@Component({
  selector: 'dialog-sizes-example',
  templateUrl: './example.html',
  imports: [IntDialog, IntButton],
})
export class DialogSizesExample {
  readonly sizes: IntDialogSize[] = ['sm', 'md', 'lg', 'xl'];
  /** Size of the open dialog (null = closed). */
  readonly openSize = signal<IntDialogSize | null>(null);
}
