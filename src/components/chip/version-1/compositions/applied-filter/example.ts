import { Component, signal } from '@angular/core';

import { IntChip } from '../../base/chip';

interface AppliedFilter {
  readonly id: string;
  readonly label: string;
}

const FILTERS: readonly AppliedFilter[] = [
  { id: 'region', label: 'Europe SEPA' },
  { id: 'brand', label: 'Mastercard' },
  { id: 'period', label: 'Q3 2026' },
];

@Component({
  selector: 'chip-applied-filter-example',
  templateUrl: './example.html',
  imports: [IntChip],
})
export class ChipAppliedFilterExample {
  readonly filters = signal(FILTERS);

  remove(id: string): void {
    this.filters.update((filters) => filters.filter((filter) => filter.id !== id));
  }
}
