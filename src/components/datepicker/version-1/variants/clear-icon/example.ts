import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/datepicker';

@Component({
  selector: 'datepicker-clear-icon-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatepickerClearIconExample {
  date: IntDatePickerValue = new Date();
}
