import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

@Component({
  selector: 'stepper-vertical-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperVerticalExample {
  readonly step = signal(1);
}
