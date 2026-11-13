import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-con-accion-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastConAccionExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({
      key: 'toastAction',
      severity: 'info',
      summary: 'Title here',
      detail: 'Write here the text of the description and to help the user to understand more information',
      life: 5000,
    });
  }
}
