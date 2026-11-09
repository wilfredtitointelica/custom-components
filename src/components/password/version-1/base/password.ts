import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Target of the overlay, same values as PrimeNG's appendTo: 'self', 'body' or an element (a template
 * variable such as [appendTo]="container").
 */
export type IntPasswordAppendTo = 'self' | 'body' | HTMLElement | ElementRef<HTMLElement>;

/** Strength levels of the meter, same names as PrimeNG's p-password-meter-<strength> classes. */
export type IntPasswordStrength = 'weak' | 'medium' | 'strong';

/** Context of the hideicon and showicon templates: class of the icon (same as PrimeNG). */
export interface IntPasswordIconTemplateContext {
  class: string;
}

// Same widths as PrimeNG's updateUI.
const METER_WIDTH: Record<IntPasswordStrength, string> = { weak: '33.33%', medium: '66.66%', strong: '100%' };

/**
 * <int-password> · version 1. Replica of PrimeNG v20 p-password without PrimeNG at runtime.
 * Text input with an optional mask toggle, clear icon and a strength meter shown in an overlay while the
 * input has the focus. The input is a provisional native input until the input component is done.
 */
@Component({
  selector: 'int-password',
  templateUrl: './password.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntPassword), multi: true }],
  // Same root as PrimeNG: p-password puts its root classes on the host element.
  host: { '[class]': 'classes()' },
})
export class IntPassword implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /** Texto que etiqueta el campo para accesibilidad. */
  readonly ariaLabel = input<string>();
  /** Ids de los elementos del DOM que etiquetan el campo. */
  readonly ariaLabelledBy = input<string>();
  /** Etiqueta del campo para accesibilidad (atributo `label`). */
  readonly label = input<string>();
  /** Texto que invita a escribir la contraseña en el medidor. Por defecto `Enter a password`. */
  readonly promptLabel = input('Enter a password');
  /** Expresión regular de una contraseña de seguridad media. */
  readonly mediumRegex = input(
    '^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})',
  );
  /** Expresión regular de una contraseña segura. */
  readonly strongRegex = input('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})');
  /** Texto de una contraseña débil. Por defecto `Weak`. */
  readonly weakLabel = input('Weak');
  /** Texto de una contraseña de seguridad media. Por defecto `Medium`. */
  readonly mediumLabel = input('Medium');
  /** Texto de una contraseña segura. Por defecto `Strong`. */
  readonly strongLabel = input('Strong');
  /** Id del campo, para enlazarlo con un `<label for>`. */
  readonly inputId = input<string>();
  /** Muestra el medidor de seguridad mientras el campo tiene el foco. */
  readonly feedback = input(true, { transform: booleanAttribute });
  /**
   * Muestra un icono para ver la contraseña como texto. int-* extension: el icono aparece solo cuando
   * el campo tiene valor.
   */
  readonly toggleMask = input(false, { transform: booleanAttribute });
  /** Clase de estilo que se agrega al campo. */
  readonly inputStyleClass = input<string>();
  /** Estilo en línea del campo. */
  readonly inputStyle = input<Record<string, string> | null>(null);
  /** Atributo `autocomplete` del campo (p. ej. `new-password`). */
  readonly autocomplete = input<string>();
  /** Texto de ayuda que se muestra con el campo vacío. */
  readonly placeholder = input<string>();
  /** Muestra un icono para borrar el valor. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el campo recibe el foco al cargar. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Índice del campo en el orden de tabulación. */
  readonly tabindex = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Variante del campo: `outlined` (por defecto) o `filled`. */
  readonly variant = input<'filled' | 'outlined'>();
  /** Tamaño del campo: `small` o `large`. */
  readonly size = input<'small' | 'large'>();
  /** Ocupa todo el ancho del contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el campo se muestra con estilo de error. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el componente queda deshabilitado. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el valor es obligatorio para enviar el formulario. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Atributo `name` del campo. */
  readonly name = input<string>();
  /** Cantidad máxima de caracteres. */
  readonly maxlength = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Cantidad mínima de caracteres. */
  readonly minlength = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** int-* extension: muestra el campo con borde, texto e icono de éxito. `invalid` tiene prioridad. */
  readonly success = input(false, { transform: booleanAttribute });
  /**
   * Dónde se inserta el panel del medidor: `self` (por defecto, debajo del campo), `body` o un elemento
   * (variable de template, p. ej. `[appendTo]="container"`), para que ningún contenedor lo recorte ni lo
   * tape.
   */
  readonly appendTo = input<IntPasswordAppendTo>('self');
  /**
   * int-* extension: el campo es de solo lectura (atributo nativo `readonly`): se ve habilitado y se
   * puede enfocar, pero no se edita; no abre el medidor ni muestra el icono de borrar.
   */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: muestra el valor sin `input`. Se dibuja un elemento con la misma apariencia del
   * campo (borde, fondo, texto enmascarado) que no se enfoca ni se edita; se comporta como `readonly`.
   * El icono de mostrar/ocultar sigue funcionando.
   */
  readonly displayOnly = input(false, { transform: booleanAttribute });

  /** Se emite cuando el campo recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el campo pierde el foco. */
  readonly onBlur = output<FocusEvent>();
  /** Se emite al borrar el valor con el icono de borrar. */
  readonly onClear = output<void>();

  /** Template `header`: contenido sobre el medidor, dentro del panel. */
  protected readonly headerTemplate = contentChild<TemplateRef<void>>('header');
  /** Template `content`: reemplaza el medidor y su texto dentro del panel. */
  protected readonly contentTemplate = contentChild<TemplateRef<void>>('content');
  /** Template `footer`: contenido bajo el medidor, dentro del panel. */
  protected readonly footerTemplate = contentChild<TemplateRef<void>>('footer');
  /** Template `clearicon`: reemplaza el icono de borrar. */
  protected readonly clearIconTemplate = contentChild<TemplateRef<void>>('clearicon');
  /** Template `hideicon`: reemplaza el icono que oculta la contraseña; recibe `class`. */
  protected readonly hideIconTemplate = contentChild<TemplateRef<IntPasswordIconTemplateContext>>('hideicon');
  /** Template `showicon`: reemplaza el icono que muestra la contraseña; recibe `class`. */
  protected readonly showIconTemplate = contentChild<TemplateRef<IntPasswordIconTemplateContext>>('showicon');

  private readonly document = inject(DOCUMENT);
  private readonly inputRef = viewChild<ElementRef<HTMLElement>>('input');
  private readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlay');

  /** Model value; null until the user types or the form writes one (same as PrimeNG). */
  protected readonly value = signal<string | null>(null);
  protected readonly focused = signal(false);
  /** Password shown as plain text (mask toggle). */
  protected readonly unmasked = signal(false);
  /** Strength overlay; opens on focus and closes on blur or Escape, as PrimeNG's overlayVisible. */
  protected readonly overlayVisible = signal(false);
  /** Disabled by the forms API (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  /** Element the overlay is moved to; null with appendTo="self" (it stays below the input). */
  protected readonly overlayTarget = computed<HTMLElement | null>(() => {
    const appendTo = this.appendTo();
    if (!appendTo || appendTo === 'self') return null;
    if (appendTo === 'body') return this.document.body;
    return appendTo instanceof ElementRef ? appendTo.nativeElement : appendTo;
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly filled = computed(() => !!this.value());
  /** Not editable: native readonly input or the displayOnly box. */
  protected readonly isReadonly = computed(() => this.readonly() || this.displayOnly());

  private readonly mediumCheck = computed(() => new RegExp(this.mediumRegex()));
  private readonly strongCheck = computed(() => new RegExp(this.strongRegex()));

  // Same levels as PrimeNG's testStrength: strong regex, then medium regex, then any text.
  protected readonly strength = computed<IntPasswordStrength | null>(() => {
    const value = this.value() ?? '';
    if (this.strongCheck().test(value)) return 'strong';
    if (this.mediumCheck().test(value)) return 'medium';
    return value.length ? 'weak' : null;
  });
  protected readonly meterWidth = computed(() => {
    const strength = this.strength();
    return strength ? METER_WIDTH[strength] : '';
  });
  protected readonly infoText = computed(() => {
    switch (this.strength()) {
      case 'weak':
        return this.weakLabel();
      case 'medium':
        return this.mediumLabel();
      case 'strong':
        return this.strongLabel();
      default:
        return this.promptLabel();
    }
  });

  /** Text of the read-only field: one bullet per character while masked. */
  protected readonly displayValue = computed(() => {
    const value = this.value() ?? '';
    return this.unmasked() ? value : '•'.repeat(value.length);
  });

  protected readonly inputClass = computed(() =>
    ['int-password__input', this.inputStyleClass()].filter(Boolean).join(' '),
  );

  protected readonly classes = computed(() => {
    const size = this.size();
    return [
      'int-password',
      this.variant() === 'filled' && 'int-password--filled',
      size === 'small' && 'int-password--small',
      size === 'large' && 'int-password--large',
      this.fluid() && 'int-password--fluid',
      this.focused() && 'int-password--focus',
      this.invalid() && 'int-password--invalid',
      this.success() && !this.invalid() && 'int-password--success',
      this.isDisabled() && 'int-password--disabled',
    ]
      .filter(Boolean)
      .join(' ');
  });

  private onModelChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Same as pAutoFocus on the input.
    afterNextRender(() => {
      if (this.autofocus() && !this.displayOnly()) this.inputRef()?.nativeElement.focus();
    });

    // appendTo="body" or an element: same as PrimeNG's appendOverlay + absolutePosition. Angular removes
    // the node with node.remove(), so the leave animation and the cleanup still work from the target.
    afterRenderEffect(() => {
      const overlay = this.overlayRef()?.nativeElement;
      const target = this.overlayTarget();
      if (!overlay || !target) return;
      if (overlay.parentElement !== target) target.appendChild(overlay);
      this.alignOverlay();
    });

    // Keep the appended overlay attached to the input while the page or a container scrolls.
    const realign = () => this.alignOverlay();
    const view = this.document.defaultView;
    view?.addEventListener('scroll', realign, true);
    view?.addEventListener('resize', realign);
    inject(DestroyRef).onDestroy(() => {
      view?.removeEventListener('scroll', realign, true);
      view?.removeEventListener('resize', realign);
    });
  }

  // Below the input, or above it when there is no room below (same as PrimeNG's absolutePosition).
  // Coordinates are relative to the overlay's containing block: the page, or a positioned target.
  private alignOverlay(): void {
    const overlay = this.overlayRef()?.nativeElement;
    const anchor = this.inputRef()?.nativeElement;
    const view = this.document.defaultView;
    if (!overlay || !anchor || !view || !this.overlayTarget()) return;
    const rect = anchor.getBoundingClientRect();
    const flip = rect.bottom + overlay.offsetHeight > view.innerHeight && rect.top > overlay.offsetHeight;
    const origin = this.containingBlockOrigin(overlay, view);
    overlay.classList.toggle('int-password__overlay--top', flip);
    overlay.style.minWidth = `${rect.width}px`;
    overlay.style.left = `${rect.left - origin.left}px`;
    overlay.style.top = `${(flip ? rect.top - overlay.offsetHeight : rect.bottom) - origin.top}px`;
  }

  /** Viewport position of the box an absolute element is placed against (the page when nothing is positioned). */
  private containingBlockOrigin(element: HTMLElement, view: Window): { left: number; top: number } {
    const parent = element.offsetParent;
    if (!(parent instanceof HTMLElement) || parent === this.document.body) {
      return { left: -view.scrollX, top: -view.scrollY };
    }
    const rect = parent.getBoundingClientRect();
    return {
      left: rect.left + parent.clientLeft - parent.scrollLeft,
      top: rect.top + parent.clientTop - parent.scrollTop,
    };
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onModelChange(value);
  }

  protected onInputFocus(event: FocusEvent): void {
    this.focused.set(true);
    if (this.feedback() && !this.isReadonly()) this.overlayVisible.set(true);
    this.onFocus.emit(event);
  }

  protected onInputBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.overlayVisible.set(false);
    this.onTouched();
    this.onBlur.emit(event);
  }

  // Same as PrimeNG's onKeyUp: Escape closes the meter, any other key reopens it.
  protected onKeyUp(event: KeyboardEvent): void {
    if (!this.feedback() || this.isReadonly()) return;
    if (event.code === 'Escape') {
      this.overlayVisible.set(false);
      return;
    }
    this.overlayVisible.set(true);
  }

  protected onMaskToggle(): void {
    if (this.isDisabled()) return;
    this.unmasked.update((unmasked) => !unmasked);
  }

  /** Borra el valor, lo notifica al formulario y emite `onClear`. */
  clear(): void {
    if (this.isDisabled() || this.isReadonly()) return;
    this.value.set(null);
    this.onModelChange(null);
    this.onClear.emit();
  }

  /** Escribe el valor del formulario. */
  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? null);
  }

  /** Registra el callback de cambio del formulario. */
  registerOnChange(fn: (value: string | null) => void): void {
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
