import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntListBox } from '../../../../list-box/version-1/base/list-box';
import { IntPopover } from '../../base/popover';

interface Member {
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'popover-select-data-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton, IntListBox, FormsModule],
})
export class PopoverSelectDataExample {
  readonly members: Member[] = [
    { name: 'Amy Elsner', email: 'amy@email.com', role: 'Owner' },
    { name: 'Bernardo Dominic', email: 'bernardo@email.com', role: 'Editor' },
    { name: 'Ioni Bowcher', email: 'ioni@email.com', role: 'Viewer' },
  ];
  readonly selectedMember = signal<Member | null>(null);
}
