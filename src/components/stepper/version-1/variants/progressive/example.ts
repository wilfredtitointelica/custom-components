import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

@Component({
  selector: 'stepper-progressive-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperProgressiveExample {
  readonly step = signal(3);
}
