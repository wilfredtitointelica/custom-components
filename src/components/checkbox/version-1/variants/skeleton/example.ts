import { Component, signal } from '@angular/core';

import { IntCheckbox } from '../../base/checkbox';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'checkbox-skeleton-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, IntButton, IntSkeletonMask],
})
export class CheckboxSkeletonExample {
  readonly loading = signal(true);
}
