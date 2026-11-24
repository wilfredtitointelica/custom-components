import { Component, signal } from '@angular/core';

import { IntInputText } from '../../base/inputtext';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'inputtext-skeleton-example',
  templateUrl: './example.html',
  imports: [IntInputText, IntButton, IntSkeletonMask],
})
export class InputtextSkeletonExample {
  readonly loading = signal(true);
}
