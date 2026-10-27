import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDatePicker } from '../../../../date-picker/version-1/base/date-picker';
import { IntDropdownSelect } from '../../../../dropdown-select/version-1/base/dropdown-select';
import { IntInputText } from '../../../../input/version-1/base/input-text';
import { IntDialogModal } from '../../base/dialog-modal';

@Component({
  selector: 'dialog-modal-basic-example',
  templateUrl: './example.html',
  imports: [IntDialogModal, IntButton, IntInputText, IntDropdownSelect, IntDatePicker, FormsModule],
})
export class DialogModalBasicExample {
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
