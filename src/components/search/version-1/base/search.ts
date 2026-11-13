import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, input, output, signal,
  viewChild, ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IntInputText } from '../../../input/version-1/base/input-text';

/** Size of the field, same values as PrimeNG InputText pSize. */
export type IntSearchSize = 'small' | 'large';

/** Payload of onSearch, same shape as PrimeNG AutoCompleteCompleteEvent. */
export interface IntSearchEvent {
  originalEvent: Event;
  query: string;
}

let nextId = 0;

/**
 * <int-search> · version 1. Replica of PrimeNG v20 p-iconfield + p-inputicon + pInputText without PrimeNG at runtime.
 * IconField wraps an input and an icon; here the text field and the search icon (always at the end, as every
 * Incontrol search) are part of the component.
 */
@Component({
  selector: 'int-search',
  templateUrl: './search.html',
  styleUrl: '../styles/_index.scss',
  imports: [IntInputText],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntSearch), multi: true }],
  // Same root as PrimeNG: p-iconfield puts its root classes on the host element.
  host: { '[class]': 'classes()' },
})
export class IntSearch implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Tamaño del campo: `small`, `large` o sin valor para el tamaño normal. */
  readonly size = input<IntSearchSize>();
  /** Texto de ayuda que se muestra cuando el campo está vacío. */
  readonly placeholder = input<string>();
  /**
   * Id del `<input>` interno, para asociarlo a un `<label for>`.
   * @defaultValue 'int-search-N' (autogenerado)
   */
  readonly inputId = input(`int-search-${nextId++}`);
  /** Nombre del control dentro del formulario. */
  readonly name = input<string>();
  /**
   * Atributo `autocomplete` del `<input>` interno; en `off` el navegador no muestra sus sugerencias de lo escrito
   * antes, que taparían el panel de un buscador.
   * @defaultValue 'off'
   */
  readonly autocomplete = input('off');
  /** Etiqueta accesible del campo. */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta al campo. */
  readonly ariaLabelledBy = input<string>();
  /** Ocupa todo el ancho del contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Muestra el estado inválido. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Deshabilita el campo. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** int-* extension: si es `true`, muestra el botón para limpiar el texto cuando el campo tiene valor. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: etiqueta accesible del botón para limpiar.
   * @defaultValue 'Clear'
   */
  readonly clearAriaLabel = input('Clear');
  /**
   * int-* extension: etiqueta accesible del botón de la lupa.
   * @defaultValue 'Search'
   */
  readonly searchAriaLabel = input('Search');

  /** int-* extension: rol del `<input>` interno, para componerlo dentro de otro `int-*` (p. ej. `combobox`). */
  readonly inputRole = input<string>();
  /** int-* extension: `aria-expanded` del `<input>` interno, para componerlo dentro de otro `int-*` con un panel. */
  readonly ariaExpanded = input<boolean>();
  /** int-* extension: `aria-controls` del `<input>` interno: id del panel que controla. */
  readonly ariaControls = input<string>();
  /** int-* extension: `aria-activedescendant` del `<input>` interno: id de la opción enfocada del panel. */
  readonly ariaActiveDescendant = input<string>();
  /** int-* extension: `aria-autocomplete` del `<input>` interno (`list`, `both`…). */
  readonly ariaAutoComplete = input<'none' | 'inline' | 'list' | 'both'>();

  /** Se emite con cada cambio del texto. */
  readonly onInput = output<Event>();
  /** Se emite cuando el campo recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el campo pierde el foco. */
  readonly onBlur = output<FocusEvent>();
  /**
   * int-* extension: se emite con cada tecla pulsada en el campo, antes de que el componente la procese.
   * Si quien escucha llama a `preventDefault()`, Enter no emite `onSearch`.
   */
  readonly onKeyDown = output<KeyboardEvent>();
  /** int-* extension: se emite al limpiar el campo con el botón para limpiar. */
  readonly onClear = output<void>();
  /** int-* extension: se emite al pulsar Enter en el campo o al hacer clic en la lupa, con el texto actual en `query`. */
  readonly onSearch = output<IntSearchEvent>();

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  /** Current text, written by the form (writeValue) or by typing. */
  protected readonly value = signal('');
  /** Disabled state set by the form (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  /** The clear button needs text to remove, same condition as showClear in PrimeNG fields ($filled). */
  protected readonly clearVisible = computed(() => this.showClear() && !!this.value() && !this.isDisabled());

  protected readonly classes = computed(() => {
    const classes = ['int-search'];
    const size = this.size();
    if (size) classes.push(`int-search--${size}`);
    if (this.fluid()) classes.push('int-search--fluid');
    if (this.clearVisible()) classes.push('int-search--clearable');
    if (this.invalid()) classes.push('int-search--invalid');
    if (this.isDisabled()) classes.push('int-search--disabled');
    return classes.join(' ');
  });

  private onModelChange: (value: string) => void = () => {};
  private onModelTouched: () => void = () => {};

  protected handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onModelChange(value);
    this.onInput.emit(event);
  }

  /** A composing int-* handles the key first; Enter runs the search unless it called preventDefault. */
  protected handleKeyDown(event: KeyboardEvent): void {
    this.onKeyDown.emit(event);
    if (event.key === 'Enter' && !event.defaultPrevented) this.search(event);
  }

  protected handleBlur(event: FocusEvent): void {
    this.onModelTouched();
    this.onBlur.emit(event);
  }

  /** int-* extension: pone el foco en el campo, para componerlo dentro de otro `int-*`. */
  focus(): void {
    this.inputEl().nativeElement.focus();
  }

  /** Runs the search with the current text (Enter on the field or click on the search icon). */
  protected search(event: Event): void {
    if (this.isDisabled()) return;
    this.onSearch.emit({ originalEvent: event, query: this.value() });
  }

  /** Empties the field, notifies the form and returns the focus to the input. */
  protected clear(): void {
    if (this.isDisabled()) return;
    this.value.set('');
    this.onModelChange('');
    this.onClear.emit();
    this.inputEl().nativeElement.focus();
  }

  /** ControlValueAccessor: escribe el valor del formulario (texto). */
  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  /** ControlValueAccessor: registra la función que avisa los cambios al formulario. */
  registerOnChange(fn: (value: string) => void): void {
    this.onModelChange = fn;
  }

  /** ControlValueAccessor: registra la función que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  /** ControlValueAccessor: deshabilita el campo desde el formulario. */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
