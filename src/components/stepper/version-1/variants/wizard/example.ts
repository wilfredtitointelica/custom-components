import { Component, signal } from '@angular/core';

import { INT_STEPPER } from '../../base/stepper';

interface WizardPanel {
  value: number;
  icon: string;
  title: string;
  subtitle: string;
}

const MOCK_PANELS: readonly WizardPanel[] = [
  { value: 1, icon: 'icon-file', title: 'Review your request', subtitle: 'Check the data before continuing.' },
  { value: 2, icon: 'icon-settings', title: 'Choose an action', subtitle: 'Select how you want to proceed.' },
  { value: 3, icon: 'icon-success', title: 'Confirm', subtitle: 'Your request is ready to be sent.' },
];

@Component({
  selector: 'stepper-wizard-example',
  templateUrl: './example.html',
  imports: [INT_STEPPER],
})
export class StepperWizardExample {
  readonly panels = MOCK_PANELS;
  readonly step = signal(1);

  nextStep(): void {
    this.step.update(step => step + 1);
  }

  prevStep(): void {
    this.step.update(step => step - 1);
  }
}
