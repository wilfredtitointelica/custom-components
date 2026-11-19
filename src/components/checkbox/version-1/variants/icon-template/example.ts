import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'checkbox-icon-template-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class CheckboxIconTemplateExample {
  favorite = true;
  row = false;
}
