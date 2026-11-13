import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

@Component({
  selector: 'date-picker-range-with-min-max-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule, JsonPipe],
})
export class DatePickerRangeWithMinMaxExample {
  private readonly today = new Date();
  readonly minDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 90);
  readonly maxDate = this.today;
  range: IntDatePickerValue = null;
}
