import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  input,
  linkedSignal,
  numberAttribute,
  output,
} from '@angular/core';

import {
  IntBaseControl,
  IntIcon,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';

/** Context of the `#icon` template: `$implicit` is the checked state and `class` the icon class (PrimeNG). */
export interface IntCheckboxIconContext {
  $implicit: boolean;
  class: string;
}

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
  styleUrl: '../styles/_index.scss',
  imports: [IntIcon, NgTemplateOutlet],
  providers: [provideValueAccessor(() => IntCheckbox)],
  host: {
    class: 'int-checkbox',
    '[class.int-checkbox--checked]': 'checked() || isIndeterminate()',
    '[class.int-checkbox--disabled]': 'isDisabled()',
    '[class.int-checkbox--invalid]': 'isInvalid()',
    '[class.int-checkbox--small]': 'size() === "small"',
    '[class.int-checkbox--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntCheckbox extends IntBaseControl<unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Elemento que se agrega o se quita del modelo cuando es un arreglo (se ignora con `binary`). */
  readonly value = input<unknown>(undefined);
  /** El modelo es un solo valor (`trueValue` / `falseValue`) en lugar de un arreglo. */
  readonly binary = input(false, { transform: booleanAttribute });
  /** Valor del modelo cuando está marcado (con `binary`). */
  readonly trueValue = input<unknown>(true);
  /** Valor del modelo cuando no está marcado (con `binary`). */
  readonly falseValue = input<unknown>(false);
  /** Muestra el estado mixto (guion); se quita en el siguiente clic del usuario. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Solo lectura: se ve normal pero no cambia. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Campo que identifica un elemento al comparar valores que son objetos. */
  readonly dataKey = input<string | undefined>(undefined);
  /** `id` del checkbox nativo, para asociarlo a un `<label for>`. */
  readonly inputId = input(uniqueId('int-checkbox'));
  /** Atributo `name` del checkbox nativo. */
  readonly name = input<string | undefined>(undefined);
  /** Nombre accesible cuando no hay `<label>`. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** `id` del elemento que nombra al checkbox. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /**
   * `tabindex` del checkbox nativo (como en PrimeNG), p. ej. `-1` cuando la fila o la celda que lo contiene
   * maneja el teclado.
   */
  readonly tabindex = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });

  /**
   * Plantilla `#icon`: reemplaza el check (y el guion del estado mixto) dentro de la caja; recibe el estado
   * marcado como `$implicit` y la clase del icono como `class`, como en PrimeNG.
   */
  protected readonly iconTemplate = contentChild<TemplateRef<IntCheckboxIconContext>>('icon');

  /** Se emite al marcar o desmarcar, con el evento y el estado nuevo. */
  readonly onChange = output<IntCheckboxChangeEvent>();

  protected readonly isIndeterminate = linkedSignal(() => this.indeterminate());

  protected readonly checked = computed(() => {
    const model = this.modelValue();
    if (this.binary()) return valueEquals(model, this.trueValue());
    return Array.isArray(model) && model.some((v) => valueEquals(v, this.value(), this.dataKey()));
  });

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
