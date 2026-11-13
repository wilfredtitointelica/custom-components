import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntToggleSwitch } from '../../base/toggle-switch';

@Component({
  selector: 'toggle-switch-forms-example',
  templateUrl: './example.html',
  imports: [IntToggleSwitch, FormsModule, IntButton],
})
export class ToggleSwitchFormsExample {
  readonly accepted = signal(false);
  readonly submitted = signal(false);
  readonly showError = computed(() => this.submitted() && !this.accepted());
}
