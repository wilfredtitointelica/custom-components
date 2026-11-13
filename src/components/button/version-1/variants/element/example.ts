import { Component, signal } from '@angular/core';

import { IntButtonElement } from '../../base/button-element';

@Component({
  selector: 'button-element-example',
  templateUrl: './example.html',
  imports: [IntButtonElement],
})
export class ButtonElementExample {
  readonly clicks = signal(0);
}
