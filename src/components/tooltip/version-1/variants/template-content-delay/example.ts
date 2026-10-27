import { Component } from '@angular/core';

import { IntPill } from '../../../../pill/version-1/base/pill';
import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-template-content-delay-example',
  templateUrl: './example.html',
  imports: [IntTooltip, IntPill],
})
export class TooltipTemplateContentDelayExample {}
