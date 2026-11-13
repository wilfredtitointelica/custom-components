import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-ancho-automatico-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastAnchoAutomaticoExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({ key: 'toastAutoWidth', severity: 'success', detail: 'Changes saved', life: 5000 });
  }
}
