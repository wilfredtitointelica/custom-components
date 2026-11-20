import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntToggleswitch } from '../../base/toggleswitch';

@Component({
  selector: 'toggleswitch-preselection-example',
  templateUrl: './example.html',
  imports: [IntToggleswitch, FormsModule],
})
export class ToggleswitchPreselectionExample {
  checked = true;
}
