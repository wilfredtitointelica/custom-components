import { Component, inject } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntConfirmationService, IntConfirmDialogModal } from '../../base/confirm-dialog-modal';

// Placeholder illustration (circle + paper plane), inline so the example needs no asset.
const IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="30" fill="#DDE6F8"/>' +
      '<path d="M17 29l26-11-9 26-5-10z" fill="#1B3E88"/></svg>',
  );

@Component({
  selector: 'confirm-dialog-modal-image-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal, IntButton],
})
export class ConfirmDialogModalImageExample {
  private readonly confirmation = inject(IntConfirmationService);

  confirm(): void {
    this.confirmation.confirm({
      key: 'image',
      image: IMAGE,
      imageAlt: '',
      header: 'Request received',
      message: 'We will contact you soon.',
      acceptLabel: 'Ok',
      rejectVisible: false,
    });
  }
}
