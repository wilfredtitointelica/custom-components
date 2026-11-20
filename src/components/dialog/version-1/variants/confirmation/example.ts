import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialog } from '../../base/dialog';

@Component({
  selector: 'dialog-confirmation-example',
  templateUrl: './example.html',
  imports: [IntDialog, IntButton],
})
export class DialogConfirmationExample {
  readonly visible = signal(false);
}
