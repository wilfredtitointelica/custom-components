import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
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
import { IntInputText } from '../../../input/version-1/base/input-text';
import {
  addDays,
  addMonths,
  compareDay,
  formatDate,
  monthNames,
  sameDay,
  sameMonth,
  startOfDay,
  weekdayNames,
} from './date-utils';

export { formatDate } from './date-utils';

/** Years per page in the year view (PrimeNG shows 10; the Intelica design shows a 3 × 4 grid). */
const YEARS_PER_PAGE = 12;
const YEAR_PAGE_ORIGIN = 2002;

export type IntDatePickerView = 'date' | 'month' | 'year';
export type IntDatePickerValue = Date | [Date, Date | null] | null;

interface DayCell {
  date: Date;
  otherMonth: boolean;
  today: boolean;
  selectable: boolean;
}

/**
 * <int-date-picker> · version 1. Single date or range, with day / month / year views; API mirrors a subset of
 * PrimeNG v20 DatePicker (ported from @intelica/ui `int-datepicker`). Range values are `[start, end]`;
 * month view yields the first day of the chosen month. Not supported yet: time picker, typed input.
 * Deviation: the year view pages 12 years (PrimeNG: a decade of 10) to fill the 3 × 4 grid of the design.
 *
 * @example
 * <int-date-picker [(ngModel)]="date" dateFormat="dd/mm/yy" showIcon showClear />
 * <int-date-picker [(ngModel)]="period" selectionMode="range" view="month" dateFormat="M yy" />
 */
@Component({
  selector: 'int-date-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NgTemplateOutlet, IntIcon, IntInputText],
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

  protected readonly config = inject(IntConfig);
  protected readonly positions = INT_DROPDOWN_POSITIONS;
  protected readonly panelId = uniqueId('int-date-picker-panel');
  private readonly injector = inject(Injector);
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly open = signal(false);
  protected readonly currentView = signal<IntDatePickerView>('date');
  /** Date with keyboard focus; also defines the displayed month/year/year page. */
  protected readonly focusedDate = signal(startOfDay(new Date()));
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

  protected readonly monthLabel = computed(() => monthNames(this.locale(), 'long')[this.focusedDate().getMonth()]);
  protected readonly shortMonths = computed(() => monthNames(this.locale(), 'short'));
  protected readonly weekdays = computed(() => weekdayNames(this.locale(), this.firstDayOfWeek()));
  /** First year of the year view page: 12-year pages (3 × 4 grid) aligned as 2002–2013, 2014–2025… */
  protected readonly yearPageStart = computed(() => {
    const year = this.focusedDate().getFullYear();
    return year - ((((year - YEAR_PAGE_ORIGIN) % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
  });
  protected readonly years = computed(() => Array.from({ length: YEARS_PER_PAGE }, (_, i) => this.yearPageStart() + i));
  protected readonly currentMonth = computed(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  protected readonly weeks = computed<DayCell[][]>(() => {
    const focused = this.focusedDate();
    const first = new Date(focused.getFullYear(), focused.getMonth(), 1);
    const offset = (first.getDay() - this.firstDayOfWeek() + 7) % 7;
    const start = addDays(first, -offset);
    const today = new Date();
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(start, w * 7 + d);
        return {
          date,
          otherMonth: date.getMonth() !== focused.getMonth(),
          today: sameDay(date, today),
          selectable: this.isSelectableDay(date),
        };
      }),
    );
  });

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
    if (!this.open()) this.resetNavigation();
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
    this.focusedDate.set(startOfDay(anchor ?? new Date()));
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
      this.focusedDate.set(new Date(year, month, 1));
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
    this.focusedDate.set(date);
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
    const next =
      view === 'date' ? addMonths(d, direction)
      : view === 'month' ? new Date(d.getFullYear() + direction, d.getMonth(), 1)
      : new Date(d.getFullYear() + direction * YEARS_PER_PAGE, d.getMonth(), 1);
    this.focusedDate.set(next);
    if (view === 'date') this.onMonthChange.emit({ month: next.getMonth() + 1, year: next.getFullYear() });
  }

  protected switchView(view: IntDatePickerView): void {
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
    const step = view === 'date' ? { h: 1, v: 7 } : { h: 1, v: 3 };
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
        if (view === 'date') this.selectDay({ date: d, otherMonth: false, today: false, selectable: this.isSelectableDay(d) });
        else if (view === 'month') this.selectMonth(d.getMonth());
        else this.selectYear(d.getFullYear());
        return;
      default:
        return;
    }
    event.preventDefault();
    this.focusedDate.set(next);
    this.onHover(next);
    this.focusActiveCell();
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
