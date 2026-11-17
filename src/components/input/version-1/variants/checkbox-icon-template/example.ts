import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-icon-template-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class InputCheckboxIconTemplateExample {
  favorite = true;
  row = false;
}
