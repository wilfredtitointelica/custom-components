import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntMessage } from '../../base/message';

@Component({
  selector: 'message-template-example',
  templateUrl: './example.html',
  imports: [IntMessage, IntButton],
})
export class MessageTemplateExample {}
