import { Component, signal } from '@angular/core';

import { IntRadioButton } from '../../base/radiobutton';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'radiobutton-skeleton-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, IntButton, IntSkeletonMask],
})
export class RadiobuttonSkeletonExample {
  readonly loading = signal(true);
  readonly feeTypes = [
    { code: 'fixed', label: 'Fixed' },
    { code: 'percentage', label: 'Percentage' },
    { code: 'mixed', label: 'Fixed + percentage' },
  ];
}
