import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/datepicker';

@Component({
  selector: 'datepicker-year-picker-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatepickerYearPickerExample {
  year: IntDatePickerValue = null;
}
