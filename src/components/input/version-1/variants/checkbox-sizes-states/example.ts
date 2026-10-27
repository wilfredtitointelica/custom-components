import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-sizes-states-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class InputCheckboxSizesStatesExample {}
