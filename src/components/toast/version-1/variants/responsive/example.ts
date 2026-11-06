import { Component, inject } from '@angular/core';

import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-responsive-example',
  templateUrl: './example.html',
  imports: [IntToast],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastResponsiveExample {
  private readonly messageService = inject(IntMessageService);

  readonly breakpoints = { '920px': { width: '100%', right: '0', left: '0' } };

  show(): void {
    this.messageService.add({ severity: 'info', summary: 'Responsive', detail: 'Full width below 920px' });
  }
}
