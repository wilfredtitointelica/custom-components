import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-corner-positions-example',
  templateUrl: './example.html',
  imports: [IntTooltip, IntButton],
})
export class TooltipCornerPositionsExample {
  readonly placements = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
}
