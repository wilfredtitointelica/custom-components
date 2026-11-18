import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDatePicker } from '../../base/date-picker';

@Component({
  selector: 'date-picker-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, IntButton, FormsModule],
})
export class DatePickerAvoidElementsExample {
  range: Date[] | null = null;
}
