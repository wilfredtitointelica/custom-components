import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import {
  IntBaseControl,
  injectStyles,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import { IntInput } from './input';

export interface IntRadioButtonClickEvent {
  originalEvent: Event;
  value: unknown;
}

/**
 * RadioButton — native `<input type="radio">` (visually replaced) bound to Angular Forms.
 * Bind every radio of a group to the same model and give them the same `name`
 * so arrow keys move the selection natively.
 *
 * @example
 * @for (type of feeTypes; track type.code) {
 *   <int-radiobutton name="feeType" [inputId]="type.code" [value]="type.code" [(ngModel)]="feeType" />
 *   <label [for]="type.code">{{ type.label }}</label>
 * }
 */
@Component({
  selector: 'int-radiobutton',
  templateUrl: './radio-button.html',
  providers: [provideValueAccessor(() => IntRadioButton)],
  host: {
    class: 'int-input int-input--radio-button',
    '[class.int-input--checked]': 'checked()',
    '[class.int-input--disabled]': 'isDisabled()',
    '[class.int-input--invalid]': 'isInvalid()',
    '[class.int-input--small]': 'size() === "small"',
    '[class.int-input--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntRadioButton extends IntBaseControl<unknown> {
  readonly value = input.required<unknown>();
  /** Groups radios for native arrow-key navigation. */
  readonly name = input<string | undefined>(undefined);
  /** Property used to compare object values. */
  readonly dataKey = input<string | undefined>(undefined);
  readonly inputId = input(uniqueId('int-radiobutton'));
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);

  readonly onClick = output<IntRadioButtonClickEvent>();

  protected readonly checked = computed(() => {
    const model = this.modelValue();
    return model != null && valueEquals(model, this.value(), this.dataKey());
  });

  constructor() {
    super();
    injectStyles(IntInput);
  }

  protected select(event: Event): void {
    if (this.isDisabled()) return;
    this.updateValue(this.value());
    this.onClick.emit({ originalEvent: event, value: this.value() });
  }
}
