import { Component } from '@angular/core';

import { IntPickList } from '../../base/pick-list';

@Component({
  selector: 'pick-list-basic-example',
  templateUrl: './example.html',
  imports: [IntPickList],
})
export class PickListBasicExample {
  source = ['Fee Library', 'Original Invoice', 'Penalty Summary', 'Fee Dashboard', 'File Sharing'];
  target: string[] = [];
}
