import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import {
  IntBaseControl,
  IntIcon,
  injectStyles,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import { IntInput } from './input';

export interface IntCheckboxChangeEvent {
  originalEvent: Event;
  checked: boolean;
}

/**
 * Checkbox — native `<input type="checkbox">` (visually replaced) bound to Angular Forms.
 *
 * - `binary`: the model is `trueValue` / `falseValue` (default `true` / `false`).
 * - Otherwise the model is an array; `value` is added or removed (several checkboxes, same model).
 *
 * @example
 * <int-checkbox inputId="terms" binary [(ngModel)]="accepted" />
 * <label for="terms">I accept</label>
 */
@Component({
  selector: 'int-checkbox',
  templateUrl: './checkbox.html',
  imports: [IntIcon],
  providers: [provideValueAccessor(() => IntCheckbox)],
  host: {
    class: 'int-input int-input--checkbox',
    '[class.int-input--checked]': 'checked() || isIndeterminate()',
    '[class.int-input--disabled]': 'isDisabled()',
    '[class.int-input--invalid]': 'isInvalid()',
    '[class.int-input--small]': 'size() === "small"',
    '[class.int-input--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntCheckbox extends IntBaseControl<unknown> {
  /** Item added to / removed from the array model (ignored when `binary`). */
  readonly value = input<unknown>(undefined);
  readonly binary = input(false, { transform: booleanAttribute });
  readonly trueValue = input<unknown>(true);
  readonly falseValue = input<unknown>(false);
  /** Shows the mixed state; cleared on the next user toggle. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Property used to compare object values in the array model. */
  readonly dataKey = input<string | undefined>(undefined);
  readonly inputId = input(uniqueId('int-checkbox'));
  readonly name = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);

  readonly onChange = output<IntCheckboxChangeEvent>();

  protected readonly isIndeterminate = linkedSignal(() => this.indeterminate());

  protected readonly checked = computed(() => {
    const model = this.modelValue();
    if (this.binary()) return valueEquals(model, this.trueValue());
    return Array.isArray(model) && model.some((v) => valueEquals(v, this.value(), this.dataKey()));
  });

  constructor() {
    super();
    injectStyles(IntInput);
  }

  protected onClick(event: Event): void {
    // A read-only checkbox keeps its state (the native input would toggle otherwise).
    if (this.readonly()) event.preventDefault();
  }

  protected toggle(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const checked = !this.checked();
    let next: unknown;
    if (this.binary()) {
      next = checked ? this.trueValue() : this.falseValue();
    } else {
      const current = Array.isArray(this.modelValue()) ? (this.modelValue() as unknown[]) : [];
      next = checked
        ? [...current, this.value()]
        : current.filter((v) => !valueEquals(v, this.value(), this.dataKey()));
    }
    this.isIndeterminate.set(false);
    this.updateValue(next);
    this.onChange.emit({ originalEvent: event, checked });
  }
}
