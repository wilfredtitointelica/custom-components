import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDatePicker, IntDatePickerValue } from '../../base/date-picker';

type Preset = 'last-12-months' | 'current-year' | 'current-month';

@Component({
  selector: 'date-picker-range-presets-example',
  templateUrl: './example.html',
  imports: [IntDatePicker, IntButton, FormsModule, JsonPipe],
})
export class DatePickerRangePresetsExample {
  readonly today = new Date(new Date().setHours(0, 0, 0, 0));
  readonly presets: { id: Preset; label: string }[] = [
    { id: 'last-12-months', label: 'Last 12 months' },
    { id: 'current-year', label: 'Current year' },
    { id: 'current-month', label: 'Current month' },
  ];
  readonly range = signal<IntDatePickerValue>(null);
  readonly selected = signal<Preset | null>(null);

  apply(preset: Preset): void {
    const year = this.today.getFullYear();
    const month = this.today.getMonth();
    const start =
      preset === 'last-12-months' ? new Date(year - 1, month, this.today.getDate() + 1)
      : preset === 'current-year' ? new Date(year, 0, 1)
      : new Date(year, month, 1);
    this.range.set([start, this.today]);
    this.selected.set(preset);
  }

  /** A day picked by hand is no longer a preset. */
  pick(value: IntDatePickerValue): void {
    this.range.set(value);
    this.selected.set(null);
  }
}
