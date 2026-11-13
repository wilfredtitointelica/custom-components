import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-basic-example',
  templateUrl: './example.html',
  imports: [IntTooltip, IntButton],
})
export class TooltipBasicExample {
  readonly placements = ['top', 'right', 'bottom', 'left'] as const;
}
