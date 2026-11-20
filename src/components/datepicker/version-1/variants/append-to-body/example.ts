import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker } from '../../base/datepicker';

@Component({
  selector: 'datepicker-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatepickerAppendToBodyExample {
  dateClipped: Date | null = null;
  date: Date | null = null;
}
