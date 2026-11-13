import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast, IntToastSeverity } from '../../base/toast';

@Component({
  selector: 'toast-sin-titulo-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastSinTituloExample {
  private readonly messageService = inject(IntMessageService);

  readonly severities: readonly IntToastSeverity[] = ['success', 'info', 'warn', 'error', 'secondary'];

  show(severity: IntToastSeverity): void {
    this.messageService.add({
      key: 'toastNoTitle',
      severity,
      detail: 'Write here the text of the description and to help the user to understand more information',
      life: 5000,
    });
  }
}
