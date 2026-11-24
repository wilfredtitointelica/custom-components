import { Component, signal } from '@angular/core';

import { IntDatePicker } from '../../base/datepicker';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'datepicker-skeleton-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, IntButton, IntSkeletonMask],
})
export class DatepickerSkeletonExample {
  readonly loading = signal(true);
}
