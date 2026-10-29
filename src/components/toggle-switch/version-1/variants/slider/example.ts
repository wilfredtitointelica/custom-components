import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntToggleSwitch } from '../../base/toggle-switch';

@Component({
  selector: 'toggle-switch-slider-example',
  templateUrl: './example.html',
  imports: [IntToggleSwitch, FormsModule],
})
export class ToggleSwitchSliderExample {
  off = false;
  on = true;
}
