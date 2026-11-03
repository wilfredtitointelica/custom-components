import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

@Component({
  selector: 'card-stretch-content-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardStretchContentExample {
  readonly cards: readonly { subheader: string; stretch: boolean }[] = [
    { subheader: 'Default', stretch: false },
    { subheader: 'stretchContent', stretch: true },
  ];
}
