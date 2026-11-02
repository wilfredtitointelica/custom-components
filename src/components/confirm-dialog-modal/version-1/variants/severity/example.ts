import { Component, inject } from '@angular/core';

import { IntConfirmationService, IntConfirmDialogModal, IntConfirmSeverity } from '../../base/confirm-dialog-modal';

interface SeverityOption {
  severity: IntConfirmSeverity;
  label: string;
  header: string;
  message: string;
}

@Component({
  selector: 'confirm-dialog-modal-severity-example',
  templateUrl: './example.html',
  imports: [IntConfirmDialogModal],
})
export class ConfirmDialogModalSeverityExample {
  private readonly confirmation = inject(IntConfirmationService);

  // Texts from Figma "↳ Message" 13146:53859.
  readonly options: SeverityOption[] = [
    { severity: 'default', label: 'Default', header: 'Request received', message: 'We will contact you soon.' },
    { severity: 'warning', label: 'Warning', header: 'Date range limit exceed', message: 'Select a range of up to 12 months.' },
    { severity: 'danger', label: 'Danger', header: 'This file will be deleted', message: 'This action cannot be undone.' },
    { severity: 'error', label: 'Error', header: 'Something went wrong', message: 'Please try again later.' },
    { severity: 'success', label: 'Success', header: 'All changes saved', message: 'Your changes were saved successfully.' },
  ];

  confirm({ severity, header, message }: SeverityOption): void {
    this.confirmation.confirm({ key: 'severity', severity, header, message });
  }
}
