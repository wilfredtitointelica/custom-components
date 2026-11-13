import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-basic-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastBasicExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Message content', life: 3000 });
  }
}
