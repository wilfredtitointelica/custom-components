import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast, IntToastSeverity } from '../../base/toast';

@Component({
  selector: 'toast-severity-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastSeverityExample {
  private readonly messageService = inject(IntMessageService);

  readonly severities: readonly IntToastSeverity[] = ['success', 'info', 'warn', 'error', 'secondary', 'contrast'];

  show(severity: IntToastSeverity): void {
    this.messageService.add({ severity, summary: severity, detail: 'Message content' });
  }
}
