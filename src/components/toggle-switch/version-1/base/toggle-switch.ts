import {
  afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, forwardRef,
  input, numberAttribute, output, signal, TemplateRef, viewChild, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** int-* extension: appearance of the switch. */
export type IntToggleSwitchVariant = 'slider';

/** Payload of onChange, same shape as PrimeNG ToggleSwitchChangeEvent. */
export interface IntToggleSwitchChangeEvent {
  originalEvent: Event;
  checked: boolean;
}

/** Context of the #handle template. */
export interface IntToggleSwitchHandleContext {
  checked: boolean;
}

let nextId = 0;

/**
 * <int-toggle-switch> · version 1. Replica of PrimeNG v20 p-toggleswitch without PrimeNG at runtime.
 * ToggleSwitch is used to select a boolean value. The knowledge base slider is the variant="slider" property; the
 * forced checked one is the forcedChecked property (on and locked).
 */
@Component({
  selector: 'int-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntToggleSwitch), multi: true }],
  // Same root as PrimeNG: p-toggleswitch puts its root classes and the click listener on the host element.
  // Angular keeps the classes the consumer writes (e.g. int-toggle-switch--slider) next to these.
  host: { '[class]': 'classes()', '(click)': 'onHostClick($event)' },
})
export class IntToggleSwitch implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Índice de tabulación del input interno. */
  readonly tabindex = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /**
   * Id del input interno; lo usa un `<label for>` externo.
   * @defaultValue 'int-toggle-switch-N' (autogenerado)
   */
  readonly inputId = input<string>(`int-toggle-switch-${nextId++}`);
  /** Si es `true`, el valor no se puede cambiar. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Valor que se escribe en el modelo cuando el switch está encendido. */
  readonly trueValue = input<unknown>(true);
  /** Valor que se escribe en el modelo cuando el switch está apagado. */
  readonly falseValue = input<unknown>(false);
  /** Etiqueta accesible del switch. */
  readonly ariaLabel = input<string>();
  /** Tamaño del componente. PrimeNG lo declara sin estilos propios; se mantiene para que migrar p- → int- compile. */
  readonly size = input<'small' | 'large'>();
  /** Id del elemento que etiqueta al switch. */
  readonly ariaLabelledBy = input<string>();
  /** Si es `true`, el input recibe el foco al cargar. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Nombre del input interno dentro del formulario. */
  readonly name = input<string>();
  /** Marca el input como obligatorio. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Muestra el estado inválido (borde de error). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Deshabilita el switch. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: apariencia. `slider` muestra el switch pequeño con un track lineal.
   */
  readonly variant = input<IntToggleSwitchVariant>();
  /**
   * int-* extension: lo muestra encendido y bloqueado. Es solo visual: no escribe en el modelo.
   */
  readonly forcedChecked = input(false, { transform: booleanAttribute });

  /** Se emite cuando cambia el valor por un clic o el teclado. */
  readonly onChange = output<IntToggleSwitchChangeEvent>();

  /** Template `handle`: contenido dentro del handle; recibe `{ checked }`. */
  protected readonly handleTemplate = contentChild<TemplateRef<IntToggleSwitchHandleContext>>('handle');
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  /** Model value, written by the form (writeValue) or by a click. */
  private readonly modelValue = signal<unknown>(undefined);
  /** Disabled state set by the form (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  readonly checked = computed(() => this.forcedChecked() || this.modelValue() === this.trueValue());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled() || this.forcedChecked());

  protected readonly classes = computed(() => {
    const classes = ['int-toggle-switch'];
    if (this.variant() === 'slider') classes.push('int-toggle-switch--slider');
    if (this.checked()) classes.push('int-toggle-switch--checked');
    if (this.isDisabled()) classes.push('int-toggle-switch--disabled');
    if (this.invalid()) classes.push('int-toggle-switch--invalid');
    if (this.forcedChecked()) classes.push('int-toggle-switch--forced-checked');
    return classes.join(' ');
  });

  private onModelChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Same as PrimeNG pAutoFocus: focus once the input is in the DOM.
    afterNextRender(() => {
      if (this.autofocus()) this.inputRef().nativeElement.focus();
    });
  }

  /** Same as PrimeNG onClick: toggles, notifies the form, emits onChange and keeps the focus on the input. */
  protected onHostClick(event: Event): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    const value = this.checked() ? this.falseValue() : this.trueValue();
    this.modelValue.set(value);
    this.onModelChange(value);
    this.onChange.emit({ originalEvent: event, checked: this.checked() });
    this.inputRef().nativeElement.focus();
  }

  /** ControlValueAccessor: escribe el valor del formulario. */
  writeValue(value: unknown): void {
    this.modelValue.set(value);
  }

  /** ControlValueAccessor: registra la función que avisa los cambios al formulario. */
  registerOnChange(fn: (value: unknown) => void): void {
    this.onModelChange = fn;
  }

  /** ControlValueAccessor: registra la función que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: deshabilita el switch desde el formulario. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
