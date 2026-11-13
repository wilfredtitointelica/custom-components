import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-animation-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastAnimationExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({ severity: 'info', summary: 'Animation', detail: 'Slides in from the right' });
  }
}
