import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

@Component({
  selector: 'date-picker-basic-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule, JsonPipe],
})
export class DatePickerBasicExample {
  date: IntDatePickerValue = new Date();
}
