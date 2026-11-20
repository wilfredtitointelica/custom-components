import { Component } from '@angular/core';

import { IntPicklist } from '../../base/picklist';

@Component({
  selector: 'picklist-basic-example',
  templateUrl: './example.html',
  imports: [IntPicklist],
})
export class PicklistBasicExample {
  source = ['Fee Library', 'Original Invoice', 'Penalty Summary', 'Fee Dashboard', 'File Sharing'];
  target: string[] = [];
}
