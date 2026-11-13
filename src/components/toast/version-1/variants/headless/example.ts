import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntProgressbar } from '../../../../progressbar/version-1/base/progressbar';
import { IntMessageService, IntToast } from '../../base/toast';

@Component({
  selector: 'toast-headless-example',
  templateUrl: './example.html',
  imports: [IntToast, IntProgressbar, IntButton],
  // Same as PrimeNG: the view that shows the toast provides the message service.
  providers: [IntMessageService],
})
export class ToastHeadlessExample {
  private readonly messageService = inject(IntMessageService);
  private interval?: ReturnType<typeof setInterval>;

  /** Upload progress shown in the toast, 0–100. */
  readonly progress = signal(0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  show(): void {
    if (this.interval) return;
    this.messageService.add({ severity: 'contrast', summary: 'Uploading your files.', sticky: true });
    this.restart();
  }

  /** Same pace as the PrimeNG demo: +20% every second up to 100%. */
  restart(): void {
    this.stop();
    this.progress.set(0);
    this.interval = setInterval(() => {
      this.progress.update((value) => Math.min(value + 20, 100));
      if (this.progress() === 100) this.stop();
    }, 1000);
  }

  stop(): void {
    clearInterval(this.interval);
    this.interval = undefined;
  }
}
