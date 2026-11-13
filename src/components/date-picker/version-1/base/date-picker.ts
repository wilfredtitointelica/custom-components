import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';

import {
  INT_DROPDOWN_POSITIONS,
  IntBaseControl,
  IntConfig,
  IntIcon,
  provideValueAccessor,
  uniqueId,
} from '../../../_shared_';
import { IntButton } from '../../../button/version-1/base/button';
import { IntInputText } from '../../../input/version-1/base/input-text';
import {
  addDays,
  addMonths,
  compareDay,
  firstOfMonth,
  formatDate,
  monthNames,
  sameDay,
  sameMonth,
  startOfDay,
  weekdayNames,
} from './date-utils';

export { formatDate } from './date-utils';

/** Years per page in the year view: a decade, as PrimeNG (2020 - 2029). */
const YEARS_PER_PAGE = 10;

export type IntDatePickerView = 'date' | 'month' | 'year';
export type IntDatePickerValue = Date | [Date, Date | null] | null;

interface DayCell {
  date: Date;
  today: boolean;
  selectable: boolean;
}

/** One month of the day view; days of other months are `null` (blank cells, as the Style Guide). */
interface MonthView {
  date: Date;
  weeks: (DayCell | null)[][];
}

/**
 * <int-date-picker> · version 1. Single date or range, with day / month / year views; API mirrors a subset of
 * PrimeNG v20 DatePicker (ported from @intelica/ui `int-datepicker`). Range values are `[start, end]`;
 * month view yields the first day of the chosen month. Not supported yet: time picker, typed input.
 * Deviation: days of other months are left blank (Style Guide `.prDatapicker`; PrimeNG shows them).
 *
 * @example
 * <int-date-picker [(ngModel)]="date" dateFormat="dd/mm/yy" showIcon showClear />
 * <int-date-picker [(ngModel)]="period" selectionMode="range" view="month" dateFormat="M yy" />
 */
@Component({
  selector: 'int-date-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NgTemplateOutlet, IntButton, IntIcon, IntInputText],
  providers: [provideValueAccessor(() => IntDatePicker)],
  templateUrl: './date-picker.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-date-picker',
    '[class.int-date-picker--inline]': 'inline()',
    '[class.int-date-picker--fluid]': 'fluid()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntDatePicker extends IntBaseControl<IntDatePickerValue> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly selectionMode = input<'single' | 'range'>('single');
  readonly view = input<IntDatePickerView>('date');
  /** PrimeNG format tokens: d, dd, m, mm, M, MM, y, yy. */
  readonly dateFormat = input<string | undefined>(undefined);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabledDates = input<Date[]>([]);
  /** Days of the week that cannot be selected (0 = Sunday). */
  readonly disabledDays = input<number[]>([]);
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Cantidad de meses que se muestran lado a lado en la vista de días (p. ej. `2` para un rango). */
  readonly numberOfMonths = input(1, { transform: numberAttribute });
  readonly placeholder = input<string | undefined>(undefined);
  readonly showIcon = input(false, { transform: booleanAttribute });
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly showButtonBar = input(false, { transform: booleanAttribute });
  readonly inline = input(false, { transform: booleanAttribute });
  readonly inputId = input(uniqueId('int-date-picker'));
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly panelStyleClass = input<string | undefined>(undefined);

  readonly onSelect = output<Date>();
  readonly onClear = output<void>();
  readonly onShow = output<void>();
  readonly onHide = output<void>();
  readonly onMonthChange = output<{ month: number; year: number }>();

  /** Template del pie del panel, debajo del calendario (p. ej. rangos predefinidos). */
  readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  protected readonly config = inject(IntConfig);
  protected readonly positions = INT_DROPDOWN_POSITIONS;
  protected readonly panelId = uniqueId('int-date-picker-panel');
  private readonly injector = inject(Injector);
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly open = signal(false);
  protected readonly currentView = signal<IntDatePickerView>('date');
  /** Date with keyboard focus; also defines the displayed year (month view) and decade (year view). */
  protected readonly focusedDate = signal(startOfDay(new Date()));
  /** First month shown in the day view (day 1); `numberOfMonths` months follow from it. */
  protected readonly firstMonth = signal(firstOfMonth(new Date()));
  private readonly hoverDate = signal<Date | null>(null);

  private readonly locale = computed(() => this.config.locale());
  protected readonly isRange = computed(() => this.selectionMode() === 'range');
  private readonly format = computed(
    () => this.dateFormat() ?? (this.view() === 'month' ? 'mm/yy' : this.view() === 'year' ? 'yy' : 'mm/dd/yy'),
  );

  private readonly rangeStart = computed(() => {
    const v = this.modelValue();
    return Array.isArray(v) ? v[0] : null;
  });
  private readonly rangeEnd = computed(() => {
    const v = this.modelValue();
    return Array.isArray(v) ? v[1] : null;
  });

  protected readonly displayValue = computed(() => {
    const v = this.modelValue();
    const fmt = (d: Date | null) => (d ? formatDate(d, this.format(), this.locale()) : '');
    if (v == null) return '';
    if (Array.isArray(v)) return v[1] ? `${fmt(v[0])} - ${fmt(v[1])}` : fmt(v[0]);
    return fmt(v);
  });
  protected readonly hasValue = computed(() => this.modelValue() != null);

  protected readonly longMonths = computed(() => monthNames(this.locale(), 'long'));
  protected readonly shortMonths = computed(() => monthNames(this.locale(), 'short'));
  protected readonly weekdays = computed(() => weekdayNames(this.locale(), this.firstDayOfWeek()));
  /** First year of the decade shown in the year view (2020 - 2029). */
  protected readonly yearPageStart = computed(
    () => Math.floor(this.focusedDate().getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE,
  );
  protected readonly years = computed(() => Array.from({ length: YEARS_PER_PAGE }, (_, i) => this.yearPageStart() + i));
  protected readonly currentMonth = computed(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  protected readonly months = computed<MonthView[]>(() =>
    Array.from({ length: this.monthCount() }, (_, i) => {
      const date = addMonths(this.firstMonth(), i);
      return { date, weeks: this.weeksOf(date) };
    }),
  );

  /** Visible navigation arrows: hidden when the previous / next page is entirely out of minDate–maxDate. */
  protected readonly canNavigate = computed(() => {
    const view = this.currentView();
    if (view === 'date') {
      const prev = addMonths(this.firstMonth(), -1);
      const next = addMonths(this.firstMonth(), this.monthCount());
      return {
        prev: this.isSelectableMonth(prev.getFullYear(), prev.getMonth()),
        next: this.isSelectableMonth(next.getFullYear(), next.getMonth()),
      };
    }
    const [prev, next] =
      view === 'month'
        ? [this.focusedDate().getFullYear() - 1, this.focusedDate().getFullYear() + 1]
        : [this.yearPageStart() - 1, this.yearPageStart() + YEARS_PER_PAGE];
    const min = this.minDate()?.getFullYear();
    const max = this.maxDate()?.getFullYear();
    return { prev: min == null || prev >= min, next: max == null || next <= max };
  });

  private readonly monthCount = computed(() => Math.max(1, this.numberOfMonths()));

  /** Weeks of `month`, only as many rows as the month needs; other-month days are null. */
  private weeksOf(month: Date): (DayCell | null)[][] {
    const offset = (month.getDay() - this.firstDayOfWeek() + 7) % 7;
    const start = addDays(month, -offset);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const today = new Date();
    return Array.from({ length: Math.ceil((offset + days) / 7) }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(start, w * 7 + d);
        if (!sameMonth(date, month)) return null;
        return { date, today: sameDay(date, today), selectable: this.isSelectableDay(date) };
      }),
    );
  }

  // ---------- Selection state helpers (used by the template) ----------

  protected isSelected(date: Date, unit: 'day' | 'month' | 'year' = 'day'): boolean {
    const same = (a: Date | null | undefined) =>
      unit === 'day' ? sameDay(a, date) : unit === 'month' ? sameMonth(a, date) : a?.getFullYear() === date.getFullYear();
    const v = this.modelValue();
    return Array.isArray(v) ? same(v[0]) || same(v[1]) : same(v);
  }

  protected isInRange(date: Date): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd() ?? this.hoverDate();
    if (!this.isRange() || !start || !end) return false;
    const [a, b] = compareDay(start, end) <= 0 ? [start, end] : [end, start];
    return compareDay(date, a) > 0 && compareDay(date, b) < 0;
  }

  protected isSelectableDay(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && compareDay(date, min) < 0) return false;
    if (max && compareDay(date, max) > 0) return false;
    if (this.disabledDays().includes(date.getDay())) return false;
    return !this.disabledDates().some((d) => sameDay(d, date));
  }

  protected isSelectableMonth(year: number, month: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const last = new Date(year, month + 1, 0);
    return !(min && compareDay(last, min) < 0) && !(max && compareDay(new Date(year, month, 1), max) > 0);
  }

  protected isSelectableYear(year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    return !(min && year < min.getFullYear()) && !(max && year > max.getFullYear());
  }

  protected monthDate(month: number): Date {
    return new Date(this.focusedDate().getFullYear(), month, 1);
  }

  protected yearDate(year: number): Date {
    return new Date(year, 0, 1);
  }

  protected cellId(date: Date): string {
    return `${this.panelId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  override writeValue(value: IntDatePickerValue): void {
    super.writeValue(value);
    // Also while open: a value set from outside (e.g. a preset in the footer) shows its month.
    this.resetNavigation();
  }

  // ---------- Opening / closing ----------

  show(): void {
    if (this.isDisabled() || this.open() || this.inline()) return;
    this.resetNavigation();
    this.open.set(true);
    this.focusActiveCell();
    this.onShow.emit();
  }

  close(focusInput = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.hoverDate.set(null);
    this.markAsTouched();
    if (focusInput) this.inputEl()?.nativeElement.focus();
    this.onHide.emit();
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    this.updateValue(null);
    this.onClear.emit();
  }

  private resetNavigation(): void {
    const v = this.modelValue();
    const anchor = Array.isArray(v) ? v[0] : v;
    const date = startOfDay(anchor ?? new Date());
    // With several months, keep them inside minDate–maxDate (today at maxDate shows as the last month).
    let first = firstOfMonth(date);
    const max = this.maxDate();
    const min = this.minDate();
    if (max) first = new Date(Math.min(first.getTime(), addMonths(firstOfMonth(max), 1 - this.monthCount()).getTime()));
    if (min) first = new Date(Math.max(first.getTime(), firstOfMonth(min).getTime()));
    this.firstMonth.set(first);
    this.focusedDate.set(date);
    this.currentView.set(this.view());
  }

  // ---------- Selection ----------

  protected selectDay(cell: DayCell, event?: Event): void {
    if (!cell.selectable) return;
    event?.stopPropagation();
    this.commit(cell.date);
  }

  protected selectMonth(month: number): void {
    const year = this.focusedDate().getFullYear();
    if (!this.isSelectableMonth(year, month)) return;
    if (this.view() === 'month') {
      this.commit(new Date(year, month, 1));
    } else {
      this.firstMonth.set(new Date(year, month, 1));
      this.focus(new Date(year, month, 1));
      this.currentView.set('date');
      this.focusActiveCell();
    }
  }

  protected selectYear(year: number): void {
    if (!this.isSelectableYear(year)) return;
    if (this.view() === 'year') {
      this.commit(new Date(year, 0, 1));
    } else {
      this.focusedDate.set(new Date(year, this.focusedDate().getMonth(), 1));
      this.currentView.set('month');
      this.focusActiveCell();
    }
  }

  protected selectToday(): void {
    const today = startOfDay(new Date());
    if (this.isSelectableDay(today)) this.commit(today);
  }

  private commit(date: Date): void {
    let next: IntDatePickerValue;
    let complete = true;
    if (this.isRange()) {
      const start = this.rangeStart();
      const end = this.rangeEnd();
      if (!start || end) {
        next = [date, null];
        complete = false;
      } else {
        next = compareDay(date, start) < 0 ? [date, start] : [start, date];
      }
    } else {
      next = date;
    }
    this.focus(date);
    this.updateValue(next);
    this.onSelect.emit(date);
    if (complete && !this.inline()) this.close();
  }

  protected onHover(date: Date | null): void {
    if (this.isRange() && this.rangeStart() && !this.rangeEnd()) this.hoverDate.set(date);
  }

  // ---------- Navigation ----------

  protected navigate(direction: 1 | -1): void {
    const view = this.currentView();
    const d = this.focusedDate();
    if (view === 'date') {
      const first = addMonths(this.firstMonth(), direction);
      this.firstMonth.set(first);
      this.focus(addMonths(d, direction));
      this.onMonthChange.emit({ month: first.getMonth() + 1, year: first.getFullYear() });
      return;
    }
    const years = view === 'month' ? direction : direction * YEARS_PER_PAGE;
    this.focusedDate.set(new Date(d.getFullYear() + years, d.getMonth(), 1));
  }

  /** Opens the month or year view; from a month title, `from` is that month. */
  protected switchView(view: IntDatePickerView, from?: Date): void {
    if (from && !sameMonth(from, this.focusedDate())) this.focusedDate.set(from);
    this.currentView.set(view);
    this.focusActiveCell();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'Enter', ' '].includes(event.key) && !this.open()) {
      event.preventDefault();
      this.show();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  /** Keyboard support inside the day / month / year grids (WAI-ARIA date picker dialog pattern). */
  protected onGridKeydown(event: KeyboardEvent): void {
    const view = this.currentView();
    const d = this.focusedDate();
    const step = { h: 1, v: view === 'date' ? 7 : view === 'month' ? 3 : 2 };
    let next: Date | null = null;
    const move = (n: number) =>
      view === 'date' ? addDays(d, n)
      : view === 'month' ? new Date(d.getFullYear(), d.getMonth() + n, 1)
      : new Date(d.getFullYear() + n, d.getMonth(), 1);

    switch (event.key) {
      case 'ArrowRight': next = move(step.h); break;
      case 'ArrowLeft': next = move(-step.h); break;
      case 'ArrowDown': next = move(step.v); break;
      case 'ArrowUp': next = move(-step.v); break;
      case 'PageDown': next = view === 'date' ? addMonths(d, 1) : move(view === 'month' ? 12 : YEARS_PER_PAGE); break;
      case 'PageUp': next = view === 'date' ? addMonths(d, -1) : move(view === 'month' ? -12 : -YEARS_PER_PAGE); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (view === 'date') this.selectDay({ date: d, today: false, selectable: this.isSelectableDay(d) });
        else if (view === 'month') this.selectMonth(d.getMonth());
        else this.selectYear(d.getFullYear());
        return;
      default:
        return;
    }
    event.preventDefault();
    if (view === 'date') this.focus(next);
    else this.focusedDate.set(next);
    this.onHover(next);
    this.focusActiveCell();
  }

  /** Moves the keyboard focus; the day view scrolls so the focused day stays among the visible months. */
  private focus(date: Date): void {
    this.focusedDate.set(date);
    const first = this.firstMonth();
    const last = addMonths(first, this.monthCount() - 1);
    if (compareDay(date, first) < 0) this.firstMonth.set(firstOfMonth(date));
    else if (compareDay(date, new Date(last.getFullYear(), last.getMonth() + 1, 0)) > 0)
      this.firstMonth.set(addMonths(firstOfMonth(date), 1 - this.monthCount()));
  }

  private focusActiveCell(): void {
    afterNextRender(
      () => this.panelEl()?.nativeElement.querySelector<HTMLElement>('[data-active="true"]')?.focus(),
      { injector: this.injector },
    );
  }

  protected onOutsideClick(event: MouseEvent): void {
    const host = this.inputEl()?.nativeElement.parentElement;
    if (!host?.contains(event.target as Node)) this.close(false);
  }

  protected isActiveCell(date: Date, unit: 'day' | 'month' | 'year'): boolean {
    const f = this.focusedDate();
    return unit === 'day' ? sameDay(date, f) : unit === 'month' ? sameMonth(date, f) : date.getFullYear() === f.getFullYear();
  }
}
