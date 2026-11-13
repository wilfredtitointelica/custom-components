import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-ancho-limitado-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastAnchoLimitadoExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({
      key: 'toastLimitWidth',
      severity: 'warn',
      summary: 'Title here',
      detail: 'A long description wraps once the toast reaches its maximum width instead of growing to the whole screen.',
      life: 5000,
    });
  }
}
