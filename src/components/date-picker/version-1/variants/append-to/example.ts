import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker } from '../../base/date-picker';

@Component({
  selector: 'date-picker-append-to-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatePickerAppendToExample {
  date: Date | null = null;
}
