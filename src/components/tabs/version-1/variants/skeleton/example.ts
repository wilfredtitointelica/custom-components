import { Component, signal } from '@angular/core';

import { IntTabsImports } from '../../base/tabs';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'tabs-skeleton-example',
  templateUrl: './example.html',
  imports: [...IntTabsImports, IntButton, IntSkeletonMask],
})
export class TabsSkeletonExample {
  readonly loading = signal(true);
}
