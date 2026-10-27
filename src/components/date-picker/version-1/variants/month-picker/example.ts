import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

@Component({
  selector: 'date-picker-month-picker-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule, JsonPipe],
})
export class DatePickerMonthPickerExample {
  private readonly today = new Date();
  month: IntDatePickerValue = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  monthRange: IntDatePickerValue = null;
}
