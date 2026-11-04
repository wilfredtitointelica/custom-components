import { Component, signal } from '@angular/core';

import { IntChip } from '../../base/chip';

interface ChipItem {
  readonly id: number;
  readonly label: string;
}

const CHIPS: readonly ChipItem[] = [
  { id: 1, label: 'Action' },
  { id: 2, label: 'Comedy' },
  { id: 3, label: 'Mystery' },
];

@Component({
  selector: 'chip-removable-example',
  templateUrl: './example.html',
  imports: [IntChip],
})
export class ChipRemovableExample {
  readonly chips = signal(CHIPS);

  remove(id: number): void {
    this.chips.update((chips) => chips.filter((chip) => chip.id !== id));
  }
}
