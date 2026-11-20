import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntPopover } from '../../base/popover';

@Component({
  selector: 'popover-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton],
})
export class PopoverAppendToBodyExample {}
