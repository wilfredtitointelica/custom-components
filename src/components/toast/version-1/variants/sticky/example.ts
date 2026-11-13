import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-sticky-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastStickyExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({ severity: 'info', summary: 'Sticky', detail: 'Message content', sticky: true });
  }

  clear(): void {
    this.messageService.clear();
  }
}
