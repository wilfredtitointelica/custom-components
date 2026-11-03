import { Component, signal } from '@angular/core';

import { IntButton } from '../../base/button';

@Component({
  selector: 'button-active-example',
  templateUrl: './example.html',
  imports: [IntButton],
})
export class ButtonActiveExample {
  readonly periods = ['Day', 'Week', 'Month'];
  readonly selected = signal('Week');
}
