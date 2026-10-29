import { Component, signal } from '@angular/core';

import { IntPill } from '../../base/pill';

@Component({
  selector: 'pill-removable-example',
  templateUrl: './example.html',
  imports: [IntPill],
})
export class PillRemovableExample {
  protected readonly filters = signal(['Visa', 'Mastercard', 'Q3 2026']);
  protected readonly aiFilters = signal(['High interchange', 'Cross-border']);

  protected remove(filter: string): void {
    this.filters.update((filters) => filters.filter((item) => item !== filter));
  }

  protected removeAi(filter: string): void {
    this.aiFilters.update((filters) => filters.filter((item) => item !== filter));
  }
}
