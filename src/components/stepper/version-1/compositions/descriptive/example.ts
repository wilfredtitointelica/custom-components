import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

interface DescriptiveStep {
  value: number;
  title: string;
  description: string;
}

const DESCRIPTION = 'Write here the text of the description and to help the user to understand more information';

const MOCK_STEPS: readonly DescriptiveStep[] = [
  { value: 1, title: 'Title here', description: DESCRIPTION },
  { value: 2, title: 'Title here', description: DESCRIPTION },
  { value: 3, title: 'Title here', description: DESCRIPTION },
];

@Component({
  selector: 'stepper-descriptive-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperDescriptiveExample {
  readonly steps = MOCK_STEPS;
  readonly step = signal(1);
}
