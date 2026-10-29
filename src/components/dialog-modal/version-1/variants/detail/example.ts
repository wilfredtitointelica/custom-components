import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDialogModal } from '../../base/dialog-modal';

@Component({
  selector: 'dialog-modal-detail-example',
  templateUrl: './example.html',
  imports: [IntDialogModal, IntButton],
})
export class DialogModalDetailExample {
  readonly visible = signal(false);
  readonly rows = [
    { label: 'Fee name', value: 'Cross-border assessment' },
    { label: 'Brand', value: 'Visa' },
    { label: 'Region', value: 'Latin America & Caribbean' },
    { label: 'Effective date', value: '01/04/2026' },
    { label: 'Rate', value: '0.80 %' },
  ];
}
