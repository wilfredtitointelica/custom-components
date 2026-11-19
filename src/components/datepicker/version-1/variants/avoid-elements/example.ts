import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDatePicker } from '../../base/datepicker';

@Component({
  selector: 'datepicker-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, IntButton, FormsModule],
})
export class DatepickerAvoidElementsExample {
  range: Date[] | null = null;
}
