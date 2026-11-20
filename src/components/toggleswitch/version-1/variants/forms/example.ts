import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntToggleswitch } from '../../base/toggleswitch';

@Component({
  selector: 'toggleswitch-forms-example',
  templateUrl: './example.html',
  imports: [IntToggleswitch, FormsModule, IntButton],
})
export class ToggleswitchFormsExample {
  readonly accepted = signal(false);
  readonly submitted = signal(false);
  readonly showError = computed(() => this.submitted() && !this.accepted());
}
