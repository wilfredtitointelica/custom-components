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
      Array.from(overlay.querySelectorAll<HTMLElement>('.int-date-picker__cell--day:not(.int-date-picker__cell--other-month)')).find(
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
    expect(input.value).toBe('12/10/2026 - 25/10/2026');
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

  it('pages the year view by 12 years (2026 → 2026–2037)', () => {
    const { fixture, overlay, open } = setup('single', 'month');
    open();
    overlay.querySelector<HTMLElement>('.int-date-picker__title-button')!.click();
    fixture.detectChanges();
    const years = Array.from(overlay.querySelectorAll('.int-date-picker__cell')).map((c) => c.textContent?.trim());
    expect(years.length).toBe(12);
    expect([years[0], years[11]]).toEqual(['2026', '2037']);
    expect(overlay.querySelector('.int-date-picker__decade')?.textContent?.trim()).toBe('2026 - 2037');
  });
});
