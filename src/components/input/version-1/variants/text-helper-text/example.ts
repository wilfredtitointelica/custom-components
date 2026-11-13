import { Component } from '@angular/core';

import { IntMessage } from '../../../../message/version-1/base/message';
import { IntInputText } from '../../base/input-text';

@Component({
  selector: 'input-text-helper-text-example',
  templateUrl: './example.html',
  imports: [IntInputText, IntMessage],
})
export class InputTextHelperTextExample {}
