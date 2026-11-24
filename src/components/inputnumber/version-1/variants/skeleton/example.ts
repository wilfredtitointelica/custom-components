import { Component, signal } from '@angular/core';

import { IntInputNumber } from '../../base/inputnumber';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'inputnumber-skeleton-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, IntButton, IntSkeletonMask],
})
export class InputnumberSkeletonExample {
  readonly loading = signal(true);
}
