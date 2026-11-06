import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast, IntToastSeverity } from '../../base/toast';

@Component({
  selector: 'toast-con-titulo-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastConTituloExample {
  private readonly messageService = inject(IntMessageService);

  readonly severities: readonly IntToastSeverity[] = ['success', 'info', 'warn', 'error', 'secondary'];

  show(severity: IntToastSeverity): void {
    this.messageService.add({
      key: 'toastStandard',
      severity,
      summary: 'Title here',
      detail: 'Write here the text of the description and to help the user to understand more information',
      life: 5000,
    });
  }
}
