import { Component } from '@angular/core';

import { IntMessage } from '../../base/message';

@Component({
  selector: 'message-simple-example',
  templateUrl: './example.html',
  imports: [IntMessage],
})
export class MessageSimpleExample {}
