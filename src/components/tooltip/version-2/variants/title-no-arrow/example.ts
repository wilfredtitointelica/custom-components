import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-title-no-arrow-example',
  templateUrl: './example.html',
  imports: [IntTooltip, IntButton],
})
export class TooltipTitleNoArrowExample {}
