import { Component } from '@angular/core';

import { IntCard, IntCardContentGap } from '../../base/card';

@Component({
  selector: 'card-content-gap-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardContentGapExample {
  readonly gaps: readonly { label: string; value: IntCardContentGap }[] = [
    { label: 'none', value: 'none' },
    { label: 'small', value: 'small' },
    { label: 'medium', value: 'medium' },
    { label: 'large', value: 'large' },
  ];
}
