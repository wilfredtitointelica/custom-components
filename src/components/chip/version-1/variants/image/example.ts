import { Component, signal } from '@angular/core';

import { IntChip } from '../../base/chip';

@Component({
  selector: 'chip-image-example',
  templateUrl: './example.html',
  imports: [IntChip],
})
export class ChipImageExample {
  /** True once the second image fails to load; the chip then shows its icon. */
  readonly imageFailed = signal(false);
}
