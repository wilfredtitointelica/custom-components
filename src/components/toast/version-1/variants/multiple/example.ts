import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-multiple-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastMultipleExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.addAll([
      { severity: 'success', summary: 'Message 1', detail: 'Message content' },
      { severity: 'info', summary: 'Message 2', detail: 'Message content' },
      { severity: 'warn', summary: 'Message 3', detail: 'Message content' },
    ]);
  }
}
