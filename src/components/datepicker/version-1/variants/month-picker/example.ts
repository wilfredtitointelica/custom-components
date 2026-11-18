import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/datepicker';

@Component({
  selector: 'datepicker-month-picker-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule, JsonPipe],
})
export class DatepickerMonthPickerExample {
  readonly today = new Date();
  month: IntDatePickerValue = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  monthRange: IntDatePickerValue = null;
}
