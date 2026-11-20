import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntListbox } from '../../../../listbox/version-1/base/listbox';
import { IntPopover } from '../../base/popover';

@Component({
  selector: 'popover-basic-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton, IntListbox, FormsModule],
})
export class PopoverBasicExample {
  readonly columns = ['Brand', 'Region', 'Fee type', 'Rate', 'Effective date', 'Status'];
  visibleColumns = ['Brand', 'Fee type', 'Rate'];
}
