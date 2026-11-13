import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-binary-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class InputCheckboxBinaryExample {
  notify = false;
}
