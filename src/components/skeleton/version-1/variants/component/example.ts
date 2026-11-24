import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntCheckbox } from '../../../../checkbox/version-1/base/checkbox';
import { IntInputText } from '../../../../inputtext/version-1/base/inputtext';
import { IntSelect } from '../../../../select/version-1/base/select';
import { IntSkeletonMask } from '../../base/skeleton-mask';

@Component({
  selector: 'skeleton-component-example',
  templateUrl: './example.html',
  imports: [IntSkeletonMask, IntButton, IntInputText, IntCheckbox, IntSelect],
})
export class SkeletonComponentExample {
  readonly loading = signal(true);
  readonly regions = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
  ];
}
