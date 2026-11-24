import { Component, signal } from '@angular/core';

import { IntListbox } from '../../base/listbox';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'listbox-skeleton-example',
  templateUrl: './example.html',
  imports: [IntListbox, IntButton, IntSkeletonMask],
})
export class ListboxSkeletonExample {
  readonly loading = signal(true);
  readonly regions = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Chile', code: 'CL' },
  ];
}
