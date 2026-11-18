import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/datepicker';

@Component({
  selector: 'datepicker-basic-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule, JsonPipe],
})
export class DatepickerBasicExample {
  date: IntDatePickerValue = new Date();
}
