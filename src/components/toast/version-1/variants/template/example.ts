import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-template-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastTemplateExample {
  private readonly messageService = inject(IntMessageService);

  show(): void {
    this.messageService.add({ key: 'confirm', severity: 'success', summary: 'Can you send me the report?', sticky: true });
  }

  reply(): void {
    this.messageService.clear('confirm');
  }
}
