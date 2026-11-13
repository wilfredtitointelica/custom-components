import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

@Component({
  selector: 'date-picker-inline-disabled-weekends-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatePickerInlineDisabledWeekendsExample {
  date: IntDatePickerValue = null;
}
