import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

@Component({
  selector: 'card-selectable-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardSelectableExample {
  /** Pressed state of the first card: it toggles on each click, Enter or Space. */
  readonly selected = signal(true);
}
