import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntInputText } from '../../base/inputtext';

@Component({
  selector: 'inputtext-basic-example',
  templateUrl: './example.html',
  imports: [IntInputText, FormsModule],
})
export class InputtextBasicExample {
  name = '';
}
