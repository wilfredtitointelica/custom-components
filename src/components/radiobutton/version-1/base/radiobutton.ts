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
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';

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
  templateUrl: './radiobutton.html',
  styleUrl: '../styles/_index.scss',
  providers: [provideValueAccessor(() => IntRadioButton)],
  host: {
    class: 'int-radiobutton',
    '[class.int-radiobutton--checked]': 'checked()',
    '[class.int-radiobutton--disabled]': 'isDisabled()',
    '[class.int-radiobutton--invalid]': 'isInvalid()',
    '[class.int-radiobutton--small]': 'size() === "small"',
    '[class.int-radiobutton--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntRadioButton extends IntBaseControl<unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Valor que toma el modelo al elegir este radio. */
  readonly value = input.required<unknown>();
  /** Nombre del grupo: los radios con el mismo `name` se recorren con las flechas. */
  readonly name = input<string | undefined>(undefined);
  /** Campo que identifica el valor al comparar objetos. */
  readonly dataKey = input<string | undefined>(undefined);
  /** `id` del radio nativo, para asociarlo a un `<label for>`. */
  readonly inputId = input(uniqueId('int-radiobutton'));
  /** Nombre accesible cuando no hay `<label>`. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** `id` del elemento que nombra al radio. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);

  /** Se emite al hacer clic en el radio, con el evento y su valor. */
  readonly onClick = output<IntRadioButtonClickEvent>();

  protected readonly checked = computed(() => {
    const model = this.modelValue();
    return model != null && valueEquals(model, this.value(), this.dataKey());
  });

  protected select(event: Event): void {
    if (this.isDisabled()) return;
    this.updateValue(this.value());
    this.onClick.emit({ originalEvent: event, value: this.value() });
  }
}
