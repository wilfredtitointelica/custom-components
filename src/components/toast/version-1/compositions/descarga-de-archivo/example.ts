import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessageService, IntToast } from '../../base/toast';

/** A file the user can export; `fails` simulates an error while generating it. */
interface ExportFile {
  readonly label: string;
  readonly icon: string;
  readonly fails: boolean;
}

const FILES: readonly ExportFile[] = [
  { label: 'Download PDF', icon: 'icon icon-pdf', fails: false },
  { label: 'Download Excel', icon: 'icon icon-xsl', fails: false },
  { label: 'Download with error', icon: 'icon icon-download', fails: true },
];

/** Time the simulated export takes, in milliseconds. */
const EXPORT_TIME = 2500;

@Component({
  selector: 'toast-descarga-de-archivo-example',
  templateUrl: './example.html',
  imports: [IntToast, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastDescargaDeArchivoExample {
  private readonly messageService = inject(IntMessageService);
  private timer?: ReturnType<typeof setTimeout>;

  readonly files = FILES;
  /** One export at a time: the loading toast is replaced by clearing its key. */
  readonly busy = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  download(file: ExportFile): void {
    this.busy.set(true);
    this.messageService.add({
      key: 'download',
      severity: 'secondary',
      summary: 'Preparing your file',
      detail: 'Your download will start automatically. This may take a few seconds.',
      closable: false,
      sticky: true,
    });
    this.timer = setTimeout(() => this.finish(file.fails), EXPORT_TIME);
  }

  /** Replaces the loading toast with the result. */
  private finish(failed: boolean): void {
    this.messageService.clear('download');
    this.messageService.add(
      failed
        ? {
            key: 'download',
            severity: 'error',
            summary: 'Download failed',
            detail: 'We couldn’t generate the file. Please try again. If the issue persists, contact support.',
            life: 5000,
          }
        : {
            key: 'download',
            severity: 'success',
            summary: 'File downloaded successfully',
            detail: 'Your file has been downloaded to your device.',
            life: 5000,
          },
    );
    this.busy.set(false);
  }
}
