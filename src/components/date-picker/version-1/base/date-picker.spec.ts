import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { formatDate } from './date-utils';
import { IntDatePicker, IntDatePickerValue } from './date-picker';

@Component({
  imports: [IntDatePicker, ReactiveFormsModule],
  template: `
    <int-date-picker [formControl]="control" dateFormat="dd/mm/yy" [selectionMode]="mode()"
                     [view]="view()" [minDate]="minDate" showClear />
  `,
})
class Host {
  control = new FormControl<IntDatePickerValue>(new Date(2026, 9, 15));
  mode = signal<'single' | 'range'>('single');
  view = signal<'date' | 'month'>('date');
  minDate = new Date(2026, 9, 10);
}

describe('formatDate', () => {
  it('supports PrimeNG tokens', () => {
    const date = new Date(2026, 0, 5);
    expect(formatDate(date, 'dd/mm/yy', 'en-US')).toBe('05/01/2026');
    expect(formatDate(date, 'd/m/y', 'en-US')).toBe('5/1/26');
    expect(formatDate(date, 'MM yy', 'en-US')).toBe('January 2026');
    expect(formatDate(date, 'M yy', 'es-PE')).toBe('Ene 2026');
  });
});

describe('IntDatePicker', () => {
  function setup(mode: 'single' | 'range' = 'single', view: 'date' | 'month' = 'date') {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set(mode);
    fixture.componentInstance.view.set(view);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const open = () => {
      input.click();
      fixture.detectChanges();
    };
    const day = (n: number) =>
      Array.from(overlay.querySelectorAll<HTMLElement>('.int-date-picker__cell--day')).find(
        (d) => d.textContent?.trim() === String(n),
      )!;
    return { fixture, input, overlay, open, day, control: fixture.componentInstance.control };
  }

  it('displays the formatted value', () => {
    const { input } = setup();
    expect(input.value).toBe('15/10/2026');
  });

  it('opens on the selected month and selects a day', () => {
    const { fixture, overlay, open, day, control, input } = setup();
    open();
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    expect(day(15).classList).toContain('int-date-picker__cell--selected');
    day(20).click();
    fixture.detectChanges();
    expect((control.value as Date).getDate()).toBe(20);
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
    expect(input.value).toBe('20/10/2026');
  });

  it('does not select dates before minDate', () => {
    const { fixture, open, day, control } = setup();
    open();
    expect(day(5).classList).toContain('int-date-picker__cell--disabled');
    day(5).click();
    fixture.detectChanges();
    expect((control.value as Date).getDate()).toBe(15);
  });

  it('selects a range in two clicks, ordering the dates', () => {
    const { fixture, open, day, control, input } = setup('range');
    control.setValue(null);
    open();
    day(25).click();
    fixture.detectChanges();
    day(12).click();
    fixture.detectChanges();
    const [start, end] = control.value as [Date, Date];
    expect(start.getDate()).toBe(12);
    expect(end.getDate()).toBe(25);
    // The calendar opens on the current month.
    const monthYear = `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
    expect(input.value).toBe(`12/${monthYear} - 25/${monthYear}`);
  });

  it('moves focus with arrow keys and selects with Enter', () => {
    const { fixture, overlay, open, control } = setup();
    open();
    const grid = overlay.querySelector<HTMLElement>('[role="grid"]')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect((control.value as Date).getDate()).toBe(23);
  });

  it('selects the first day of a month in month view', () => {
    const { fixture, overlay, open, control } = setup('single', 'month');
    open();
    overlay.querySelectorAll<HTMLElement>('.int-date-picker__cell')[11].click();
    fixture.detectChanges();
    const value = control.value as Date;
    expect([value.getMonth(), value.getDate()]).toEqual([11, 1]);
  });

  it('clears the value', () => {
    const { fixture, control } = setup();
    fixture.nativeElement.querySelector('.int-date-picker__clear').click();
    expect(control.value).toBeNull();
  });

  it('pages the year view by decade, as PrimeNG (2026 → 2020 - 2029)', () => {
    const { fixture, overlay, open } = setup('single', 'month');
    open();
    overlay.querySelector<HTMLElement>('.int-date-picker__title-button')!.click();
    fixture.detectChanges();
    const years = Array.from(overlay.querySelectorAll('.int-date-picker__cell')).map((c) => c.textContent?.trim());
    expect(years.length).toBe(10);
    expect([years[0], years[9]]).toEqual(['2020', '2029']);
    expect(overlay.querySelector('.int-date-picker__decade')?.textContent?.trim()).toBe('2020 - 2029');
  });

  it('leaves days of other months blank', () => {
    const { overlay, open } = setup();
    open();
    // October 2026 has 31 days: no 1-6 of November after them.
    const days = Array.from(overlay.querySelectorAll('.int-date-picker__cell--day')).map((d) => d.textContent?.trim());
    expect(days.length).toBe(31);
  });

  it('hides the previous arrow when the previous month is before minDate', () => {
    const { overlay, open } = setup();
    open();
    const [prev, next] = Array.from(overlay.querySelectorAll<HTMLButtonElement>('.int-date-picker__nav'));
    expect(prev.disabled).toBeTrue();
    expect(next.disabled).toBeFalse();
  });

  it('paints every month of a month range as selected', () => {
    const { fixture, overlay, open, control } = setup('range', 'month');
    control.setValue([new Date(2026, 9, 1), new Date(2026, 11, 1)]);
    open();
    fixture.detectChanges();
    const nov = overlay.querySelectorAll<HTMLElement>('.int-date-picker__cell')[10];
    expect(nov.classList).toContain('int-date-picker__cell--in-range');
  });
});

@Component({
  imports: [IntDatePicker],
  template: `
    <int-date-picker inline selectionMode="range" numberOfMonths="2" [maxDate]="maxDate">
      <ng-template #footer><button type="button" class="preset">Preset</button></ng-template>
    </int-date-picker>
  `,
})
class MonthsHost {
  maxDate = new Date();
}

describe('IntDatePicker · numberOfMonths and footer', () => {
  it('shows two months, with the next arrow only on the last one and hidden at maxDate', () => {
    const fixture = TestBed.createComponent(MonthsHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.int-date-picker__month').length).toBe(2);
    expect(el.querySelectorAll('.int-date-picker__calendar').length).toBe(2);
    const navs = el.querySelectorAll<HTMLButtonElement>('.int-date-picker__nav');
    expect(navs.length).toBe(2);
    // Opens on the current month: the second one is next month, already after maxDate.
    expect(navs[1].disabled).toBeTrue();
  });

  it('renders the footer template', () => {
    const fixture = TestBed.createComponent(MonthsHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.int-date-picker__footer .preset')).not.toBeNull();
  });
});
