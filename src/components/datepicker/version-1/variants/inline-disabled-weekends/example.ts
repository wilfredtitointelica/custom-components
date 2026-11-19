import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/datepicker';

@Component({
  selector: 'datepicker-inline-disabled-weekends-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatepickerInlineDisabledWeekendsExample {
  date: IntDatePickerValue = null;
}
