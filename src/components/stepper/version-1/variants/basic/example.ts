import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

@Component({
  selector: 'stepper-basic-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperBasicExample {
  readonly step = signal(1);
}
