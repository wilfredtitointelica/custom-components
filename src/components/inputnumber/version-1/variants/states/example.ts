import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputNumber } from '../../base/inputnumber';

@Component({
  selector: 'inputnumber-states-example',
  templateUrl: './example.html',
  imports: [IntInputNumber, FormsModule],
})
export class InputnumberStatesExample {}
