import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/input-number';

@Component({
  selector: 'input-number-states-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputNumberStatesExample {}
