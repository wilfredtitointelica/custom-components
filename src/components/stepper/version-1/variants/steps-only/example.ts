import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

@Component({
  selector: 'stepper-steps-only-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperStepsOnlyExample {
  readonly step = signal(1);
}
