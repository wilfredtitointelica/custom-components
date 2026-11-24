import { Component, signal } from '@angular/core';

import { IntButton } from '../../base/button';
import { IntButtonElement } from '../../base/button-element';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'button-skeleton-example',
  templateUrl: './example.html',
  imports: [IntButton, IntButtonElement, IntSkeletonMask],
})
export class ButtonSkeletonExample {
  readonly loading = signal(true);
}
