import { Component } from '@angular/core';

import { IntMessage } from '../../base/message';

@Component({
  selector: 'message-basic-example',
  templateUrl: './example.html',
  imports: [IntMessage],
})
export class MessageBasicExample {}
