import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import {
  IntBaseControl,
  IntConfig,
  IntIcon,
  injectStyles,
  provideValueAccessor,
  uniqueId,
} from '../../../_shared_';
import { IntInput } from './input';
import { IntInputText } from './input-text';

export interface IntInputNumberInputEvent {
  originalEvent: Event;
  value: number | null;
}

/**
 * InputNumber — numeric input with locale formatting, currency mode, min/max and spin buttons.
 * Shows the formatted value at rest and a plain editable number while focused.
 *
 * @example
 * <int-inputnumber [(ngModel)]="amount" mode="currency" currency="USD" [min]="0" />
 * <int-inputnumber [(ngModel)]="qty" showButtons [step]="5" suffix=" txn" />
 */
@Component({
  selector: 'int-inputnumber',
  imports: [IntInputText, IntIcon],
  providers: [provideValueAccessor(() => IntInputNumber)],
  templateUrl: './input-number.html',
  host: {
    class: 'int-input int-input--number',
    '[class.int-input--stacked]': 'stacked()',
    '[class.int-input--horizontal]': 'horizontal()',
    '[class.int-input--fluid]': 'fluid()',
    '[class.int-input--small]': 'size() === "small"',
    '[class.int-input--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntInputNumber extends IntBaseControl<number> {
  readonly mode = input<'decimal' | 'currency'>('decimal');
  /** ISO 4217 code, required when mode is `currency`. */
  readonly currency = input<string | undefined>(undefined);
  readonly currencyDisplay = input<'symbol' | 'code' | 'name' | 'narrowSymbol'>('symbol');
  /** Overrides the global locale from `provideIntelicaUI`. */
  readonly locale = input<string | undefined>(undefined);
  readonly minFractionDigits = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly maxFractionDigits = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly useGrouping = input(true, { transform: booleanAttribute });
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly step = input(1, { transform: numberAttribute });
  readonly prefix = input('');
  readonly suffix = input('');
  readonly showButtons = input(false, { transform: booleanAttribute });
  readonly buttonLayout = input<'stacked' | 'horizontal'>('stacked');
  readonly placeholder = input<string | undefined>(undefined);
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inputId = input(uniqueId('int-inputnumber'));
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly onInput = output<IntInputNumberInputEvent>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();

  protected readonly config = inject(IntConfig);

  constructor() {
    super();
    injectStyles(IntInput);
  }

  private readonly focused = signal(false);
  private readonly editText = signal('');

  protected readonly stacked = computed(() => this.showButtons() && this.buttonLayout() === 'stacked');
  protected readonly horizontal = computed(() => this.showButtons() && this.buttonLayout() === 'horizontal');

  private readonly resolvedLocale = computed(() => this.locale() ?? this.config.locale());

  private readonly formatter = computed(
    () =>
      new Intl.NumberFormat(this.resolvedLocale(), {
        style: this.mode() === 'currency' ? 'currency' : 'decimal',
        currency: this.mode() === 'currency' ? this.currency() : undefined,
        currencyDisplay: this.currencyDisplay(),
        minimumFractionDigits: this.minFractionDigits(),
        maximumFractionDigits: this.maxFractionDigits(),
        useGrouping: this.useGrouping(),
      }),
  );

  /** Separators of the active locale, used to parse what the user types. */
  private readonly separators = computed(() => {
    const parts = new Intl.NumberFormat(this.resolvedLocale()).formatToParts(11111.1);
    return {
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
    };
  });

  protected readonly display = computed(() => {
    if (this.focused()) return this.editText();
    const v = this.modelValue();
    return v == null ? '' : `${this.prefix()}${this.formatter().format(v)}${this.suffix()}`;
  });

  /** Plain representation used while editing: locale decimal separator, no grouping/symbols. */
  private toEditText(value: number | null): string {
    if (value == null) return '';
    return new Intl.NumberFormat(this.resolvedLocale(), {
      useGrouping: false,
      maximumFractionDigits: this.maxFractionDigits() ?? 20,
    }).format(value);
  }

  private parse(text: string): number | null {
    const { decimal } = this.separators();
    const allowed = new RegExp(`[^0-9\\-${escapeRegExp(decimal)}]`, 'g');
    const normalized = text.replace(allowed, '').replace(decimal, '.');
    if (normalized === '' || normalized === '-' || normalized === '.') return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  private clamp(value: number | null): number | null {
    if (value == null) return null;
    const min = this.min();
    const max = this.max();
    let v = value;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    const digits = this.maxFractionDigits();
    return digits != null ? Number(v.toFixed(digits)) : v;
  }

  protected onInputChange(event: Event, el: HTMLInputElement): void {
    const { decimal } = this.separators();
    // Keep digits, one leading minus and one decimal separator.
    let text = el.value.replace(new RegExp(`[^0-9\\-${escapeRegExp(decimal)}]`, 'g'), '');
    text = text.replace(/(?!^)-/g, '');
    const firstDecimal = text.indexOf(decimal);
    if (firstDecimal > -1) {
      text = text.slice(0, firstDecimal + 1) + text.slice(firstDecimal + 1).split(decimal).join('');
    }
    if (text !== el.value) el.value = text;
    this.editText.set(text);
    const value = this.parse(text);
    this.updateValue(value);
    this.onInput.emit({ originalEvent: event, value });
  }

  protected onInputFocus(event: FocusEvent): void {
    this.editText.set(this.toEditText(this.modelValue()));
    this.focused.set(true);
    this.onFocus.emit(event);
  }

  protected onInputBlur(event: FocusEvent): void {
    const value = this.clamp(this.parse(this.editText()));
    this.focused.set(false);
    if (value !== this.modelValue()) this.updateValue(value);
    this.markAsTouched();
    this.onBlur.emit(event);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.spin(event, event.key === 'ArrowUp' ? 1 : -1);
    }
  }

  protected spin(event: Event, direction: 1 | -1): void {
    if (this.isDisabled() || this.readonly()) return;
    const next = this.clamp((this.modelValue() ?? 0) + direction * this.step());
    this.updateValue(next);
    if (this.focused()) this.editText.set(this.toEditText(next));
    this.onInput.emit({ originalEvent: event, value: next });
  }
}

function optionalNumber(value: unknown): number | undefined {
  return value == null || value === '' ? undefined : numberAttribute(value);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
