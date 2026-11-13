import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Payload of onChange: same shape as PrimeNG's InputOtpChangeEvent. */
export interface IntInputotpChangeEvent {
  originalEvent: Event;
  value: string;
}

/** Handlers a custom cell of the input template binds to its own input (same as PrimeNG). */
export interface IntInputotpTemplateEvents {
  input: (event: Event) => void;
  keydown: (event: KeyboardEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  paste: (event: ClipboardEvent) => void;
}

/** Context of the input template: token of the cell, its handlers and its 1-based index. */
export interface IntInputotpInputTemplateContext {
  $implicit: string;
  events: IntInputotpTemplateEvents;
  index: number;
}

/** Context of the separator template: 1-based index of the cell the separator follows. */
export interface IntInputotpSeparatorTemplateContext {
  $implicit: number;
}

/** Accepts 3, '3', '3,6' or [3, 6]: cell positions (1-based) followed by a separator. */
function toPositions(value: number | string | readonly number[] | null | undefined): readonly number[] {
  if (value === null || value === undefined || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map(Number).filter((position) => Number.isInteger(position) && position > 0);
}

/**
 * <int-inputotp> · version 1. Replica of PrimeNG v20 p-inputotp without PrimeNG at runtime.
 * One text input per character; typing moves to the next cell, Backspace to the previous one and a
 * paste fills every cell. Each cell is a provisional native input until the input component is done.
 */
@Component({
  selector: 'int-inputotp',
  templateUrl: './inputotp.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntInputotp), multi: true }],
  // Same root as PrimeNG: p-inputotp puts its root class on the host element. The state modifiers live
  // on the block so cells rendered by the input template get them too.
  host: { '[class]': 'classes()', '[attr.aria-busy]': 'loading() || null' },
})
export class IntInputotp implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Cuando está presente, los campos son de solo lectura. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Índice de los campos en el orden de tabulación. */
  readonly tabindex = input<number | null>(null);
  /** Cantidad de caracteres (celdas) del código. */
  readonly length = input(4, { transform: numberAttribute });
  /** Clase de estilo que se agrega a cada campo. */
  readonly styleClass = input<string>();
  /** Oculta los caracteres como en un campo de contraseña. */
  readonly mask = input(false, { transform: booleanAttribute });
  /** Cuando está presente, solo acepta dígitos. */
  readonly integerOnly = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el primer campo recibe el foco al cargar. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /**
   * Variante del campo: `outlined` (por defecto) o `filled`. int-* extension: `underlined` deja solo la
   * línea inferior de cada celda.
   */
  readonly variant = input<'filled' | 'outlined' | 'underlined'>();
  /** Tamaño de las celdas: `small` o `large`. */
  readonly size = input<'small' | 'large'>();
  /** Cuando está presente, los campos se muestran con estilo de error. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el componente queda deshabilitado. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el valor es obligatorio para enviar el formulario. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Atributo `name` de los campos. */
  readonly name = input<string>();
  /** int-* extension: muestra los campos con borde y texto de éxito (código validado). `invalid` tiene prioridad. */
  readonly success = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: une las celdas sin espacio entre ellas, con el borde redondeado solo en los extremos.
   * Con `separatorAt` se forma un grupo a cada lado del separador.
   */
  readonly grouped = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: muestra un indicador de carga en cada celda mientras se valida el código. Oculta los
   * caracteres y bloquea la edición; el valor se conserva.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: posición de la celda (desde 1) tras la que se dibuja un separador. Acepta varias:
   * `separatorAt="3"`, `separatorAt="4,8"` o `[separatorAt]="[4, 8]"`. Se ignoran las posiciones desde `length`.
   */
  readonly separatorAt = input<readonly number[], number | string | readonly number[] | null | undefined>([], {
    transform: toPositions,
  });

  /** Se emite cuando cambia el valor. */
  readonly onChange = output<IntInputotpChangeEvent>();
  /** Se emite cuando un campo recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando un campo pierde el foco. */
  readonly onBlur = output<FocusEvent>();

  /** Template `input`: reemplaza cada celda; recibe el carácter (`$implicit`), los handlers `events` e `index` (desde 1). */
  protected readonly inputTemplate =
    contentChild<TemplateRef<IntInputotpInputTemplateContext>>('input');
  /** int-* extension: template `separator`; reemplaza la línea de cada separador de `separatorAt` y recibe la posición (`$implicit`). */
  protected readonly separatorTemplate =
    contentChild<TemplateRef<IntInputotpSeparatorTemplateContext>>('separator');

  /** One character per cell; joined, it is the model value. */
  protected readonly tokens = signal<readonly string[]>([]);
  /** Disabled by the forms API (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly cells = computed(() => Array.from({ length: this.length() }, (_, i) => i));
  /** Positions inside the code: a separator after the last cell would only add trailing space. */
  protected readonly separators = computed(
    () => new Set(this.separatorAt().filter((position) => position < this.length())),
  );
  protected readonly inputClass = computed(() =>
    ['int-inputotp__input', this.styleClass()].filter(Boolean).join(' '),
  );

  // Handlers per cell for the input template; rebuilt only when the length changes.
  private readonly cellEvents = computed(() =>
    this.cells().map<IntInputotpTemplateEvents>((i) => ({
      input: (event) => this.onInput(event, i),
      keydown: (event) => this.onKeyDown(event),
      focus: (event) => this.onFocus.emit(event),
      blur: (event) => this.onInputBlur(event),
      paste: (event) => this.onPaste(event),
    })),
  );
  protected readonly templateContexts = computed(() =>
    this.cellEvents().map<IntInputotpInputTemplateContext>((events, i) => ({
      $implicit: this.tokens()[i] ?? '',
      events,
      index: i + 1,
    })),
  );

  protected readonly classes = computed(() => {
    const size = this.size();
    return [
      'int-inputotp',
      size === 'small' && 'int-inputotp--small',
      size === 'large' && 'int-inputotp--large',
      this.variant() === 'filled' && 'int-inputotp--filled',
      this.variant() === 'underlined' && 'int-inputotp--underlined',
      this.grouped() && 'int-inputotp--grouped',
      this.invalid() && 'int-inputotp--invalid',
      this.success() && !this.invalid() && 'int-inputotp--success',
      this.isDisabled() && 'int-inputotp--disabled',
      this.loading() && 'int-inputotp--loading',
    ]
      .filter(Boolean)
      .join(' ');
  });

  private onModelChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Same as pAutoFocus on the first cell.
    afterNextRender(() => {
      if (this.autofocus()) this.inputs()[0]?.focus();
    });
  }

  protected onInput(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    // The first cell accepts the whole code (maxlength = length): browser autofill of one-time codes.
    if (index === 0 && value.length > 1) {
      this.handleOnPaste(value, event);
      event.stopPropagation();
      return;
    }
    this.tokens.update((tokens) => {
      const next = [...tokens];
      next[index] = value;
      return next;
    });
    this.updateModel(event);
    const inputType = (event as InputEvent).inputType;
    if (inputType === 'deleteContentBackward') this.moveToPrev(target);
    else if (inputType === 'insertText' || inputType === 'deleteContentForward') this.moveToNext(target);
  }

  protected onInputFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
    this.onFocus.emit(event);
  }

  protected onInputBlur(event: FocusEvent): void {
    this.onTouched();
    this.onBlur.emit(event);
  }

  // Same keys and conditions as PrimeNG's onKeyDown.
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLInputElement;
    switch (event.key) {
      case 'ArrowLeft':
        this.moveToPrev(target);
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        break;
      case 'Backspace':
        if (target.value.length === 0) {
          this.moveToPrev(target);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        this.moveToNext(target);
        event.preventDefault();
        break;
      default: {
        // Difference with PrimeNG: Tab, Delete, Enter… always pass through (PrimeNG blocks Tab with
        // integerOnly or when the code is complete); only printable keys are filtered.
        if (event.key.length > 1) break;
        const hasSelection = target.selectionStart !== target.selectionEnd;
        const isAtMaxLength = this.tokens().join('').length >= this.length();
        const isValidKey = this.integerOnly() ? /^[0-9]$/.test(event.key) : true;
        if (!isValidKey || (isAtMaxLength && !hasSelection)) {
          event.preventDefault();
        }
      }
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const paste = event.clipboardData?.getData('text') ?? '';
    if (paste.length) this.handleOnPaste(paste, event);
    event.preventDefault();
  }

  private handleOnPaste(paste: string, event: Event): void {
    const code = paste.substring(0, this.length());
    if (!this.integerOnly() || /^[0-9]+$/.test(code)) {
      this.tokens.set(code.split(''));
      this.updateModel(event);
    }
  }

  private updateModel(event: Event): void {
    const value = this.tokens().join('');
    this.onModelChange(value);
    this.onChange.emit({ originalEvent: event, value });
  }

  // Every input inside the block, own cells or template cells; separators in between are skipped.
  private inputs(): HTMLInputElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll('input'));
  }

  private moveToPrev(target: HTMLInputElement): void {
    const inputs = this.inputs();
    this.focusCell(inputs[inputs.indexOf(target) - 1]);
  }

  private moveToNext(target: HTMLInputElement): void {
    const inputs = this.inputs();
    const index = inputs.indexOf(target);
    if (index >= 0) this.focusCell(inputs[index + 1]);
  }

  private focusCell(cell: HTMLInputElement | undefined): void {
    cell?.focus();
    cell?.select();
  }

  /** Escribe el valor del formulario (texto o arreglo de caracteres), recortado a `length`. */
  writeValue(value: string | readonly string[] | null | undefined): void {
    if (value === null || value === undefined || value === '') {
      this.tokens.set([]);
      return;
    }
    const chars = Array.isArray(value) ? [...value] : String(value).split('');
    this.tokens.set(chars.slice(0, this.length()));
  }

  /** Registra el callback de cambio del formulario. */
  registerOnChange(fn: (value: string) => void): void {
    this.onModelChange = fn;
  }

  /** Registra el callback de "touched" del formulario. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Deshabilita el componente desde el formulario. */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
