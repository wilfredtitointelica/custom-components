import { Component } from '@angular/core';

import { IntPickList } from '../../base/pick-list';

@Component({
  selector: 'pick-list-transfer-controls-example',
  templateUrl: './example.html',
  imports: [IntPickList],
})
export class PickListTransferControlsExample {
  source = ['Fee Library', 'Original Invoice', 'Penalty Summary', 'Fee Dashboard', 'File Sharing'];
  target: string[] = [];
}
