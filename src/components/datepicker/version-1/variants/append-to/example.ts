import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDatePicker } from '../../base/datepicker';

@Component({
  selector: 'datepicker-append-to-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, FormsModule],
})
export class DatepickerAppendToExample {
  date: Date | null = null;
}
