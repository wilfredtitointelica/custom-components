import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntToggleSwitch } from '../../base/toggle-switch';

@Component({
  selector: 'toggle-switch-preselection-example',
  templateUrl: './example.html',
  imports: [IntToggleSwitch, FormsModule],
})
export class ToggleSwitchPreselectionExample {
  checked = true;
}
