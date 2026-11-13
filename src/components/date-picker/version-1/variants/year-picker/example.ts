import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

@Component({
  selector: 'date-picker-year-picker-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatePickerYearPickerExample {
  year: IntDatePickerValue = null;
}
