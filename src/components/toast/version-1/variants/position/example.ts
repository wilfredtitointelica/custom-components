import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-position-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastPositionExample {
  private readonly messageService = inject(IntMessageService);

  show(key: string): void {
    this.messageService.add({ key, severity: 'info', summary: 'Info', detail: 'Message content' });
  }
}
