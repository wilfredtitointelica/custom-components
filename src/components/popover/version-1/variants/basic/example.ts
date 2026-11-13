import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntListBox } from '../../../../list-box/version-1/base/list-box';
import { IntPopover } from '../../base/popover';

@Component({
  selector: 'popover-basic-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton, IntListBox, FormsModule],
})
export class PopoverBasicExample {
  readonly columns = ['Brand', 'Region', 'Fee type', 'Rate', 'Effective date', 'Status'];
  visibleColumns = ['Brand', 'Fee type', 'Rate'];
}
