import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntPopover } from '../../base/popover';

@Component({
  selector: 'popover-info-card-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton],
})
export class PopoverInfoCardExample {
  readonly opened = signal(0);
}
