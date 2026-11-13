import { Component } from '@angular/core';

import { IntTooltip } from '../../base/tooltip';

@Component({
  selector: 'tooltip-truncated-cell-example',
  templateUrl: './example.html',
  imports: [IntTooltip],
  // The truncation belongs to the consumer's table cell, not to the tooltip.
  styles: `
    span {
      display: inline-block;
      max-width: 16rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
  `,
})
export class TooltipTruncatedCellExample {
  readonly fee = 'Mastercard Cross-Border Assessment Fee — Consumer Credit';
}
