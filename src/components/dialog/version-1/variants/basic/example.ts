import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDatePicker } from '../../../../datepicker/version-1/base/datepicker';
import { IntSelect } from '../../../../select/version-1/base/select';
import { IntInputText } from '../../../../inputtext/version-1/base/inputtext';
import { IntDialog } from '../../base/dialog';

@Component({
  selector: 'dialog-basic-example',
  templateUrl: './example.html',
  imports: [IntDialog, IntButton, IntInputText, IntSelect, IntDatePicker, FormsModule],
})
export class DialogBasicExample {
  readonly visible = signal(false);
  readonly brands = [
    { name: 'Visa', code: 'VI' },
    { name: 'Mastercard', code: 'MC' },
    { name: 'American Express', code: 'AX' },
  ];
  name = '';
  brand: string | null = null;
  date: Date | null = null;
}
