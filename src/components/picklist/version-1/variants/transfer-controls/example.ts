import { Component } from '@angular/core';

import { IntPicklist } from '../../base/picklist';

@Component({
  selector: 'picklist-transfer-controls-example',
  templateUrl: './example.html',
  imports: [IntPicklist],
})
export class PicklistTransferControlsExample {
  source = ['Fee Library', 'Original Invoice', 'Penalty Summary', 'Fee Dashboard', 'File Sharing'];
  target: string[] = [];
}
