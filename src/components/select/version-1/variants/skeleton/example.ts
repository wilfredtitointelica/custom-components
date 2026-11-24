import { Component, signal } from '@angular/core';

import { IntSelect } from '../../base/select';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'select-skeleton-example',
  templateUrl: './example.html',
  imports: [IntSelect, IntButton, IntSkeletonMask],
})
export class SelectSkeletonExample {
  readonly loading = signal(true);
  readonly regions = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Chile', code: 'CL' },
  ];
}
