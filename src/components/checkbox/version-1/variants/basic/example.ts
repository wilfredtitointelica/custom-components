import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'checkbox-basic-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class CheckboxBasicExample {
  notify = false;
}
