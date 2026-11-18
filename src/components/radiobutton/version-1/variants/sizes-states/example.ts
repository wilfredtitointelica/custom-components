import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntRadioButton } from '../../base/radiobutton';

@Component({
  selector: 'radiobutton-sizes-states-example',
  templateUrl: './example.html',
  imports: [IntRadioButton, FormsModule],
})
export class RadiobuttonSizesStatesExample {}
