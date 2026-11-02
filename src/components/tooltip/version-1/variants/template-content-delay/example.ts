import { Component } from '@angular/core';

import { IntTag } from '../../../../tag/version-1/base/tag';
import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-template-content-delay-example',
  templateUrl: './example.html',
  imports: [IntTooltip, IntTag],
})
export class TooltipTemplateContentDelayExample {}
