import { Component, signal } from '@angular/core';

import { IntButton } from '../../base/button';

@Component({
  selector: 'button-loading-disabled-example',
  templateUrl: './example.html',
  imports: [IntButton],
})
export class ButtonLoadingDisabledExample {
  readonly exporting = signal(false);

  /** Simulates a 1.5 s export. */
  export(): void {
    this.exporting.set(true);
    setTimeout(() => this.exporting.set(false), 1500);
  }
}
