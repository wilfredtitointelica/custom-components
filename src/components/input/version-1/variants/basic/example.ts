import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputText } from '../../base/input-text';

@Component({
  selector: 'input-basic-example',
  templateUrl: './example.html',
  imports: [IntInputText, FormsModule],
})
export class InputBasicExample {
  name = '';
}
