import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntProgressbar } from '../../base/progressbar';

@Component({
  selector: 'progressbar-dynamic-example',
  templateUrl: './example.html',
  imports: [IntProgressbar],
})
export class ProgressbarDynamicExample {
  /** Progress that grows a random step every 2 seconds and starts over after 100. */
  protected readonly value = signal(0);

  constructor() {
    const interval = setInterval(() => {
      this.value.update((value) => (value >= 100 ? 0 : Math.min(100, value + Math.floor(Math.random() * 10) + 1)));
    }, 2000);
    inject(DestroyRef).onDestroy(() => clearInterval(interval));
  }
}
