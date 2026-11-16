import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  numberAttribute,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import {
  INT_DROPDOWN_POSITIONS,
  INT_DROPUP_POSITIONS,
  IntAppendTo,
  IntBaseControl,
  IntConfig,
  IntFieldAccessor,
  IntIcon,
  connectOverlayContainer,
  provideIntOverlayContainer,
  getOptionLabel,
  getOptionValue,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import {
  IntListBox,
  IntListBoxChangeEvent,
  IntListBoxItemContext,
} from '../../../list-box/version-1/base/list-box';

export interface IntDropdownSelectChangeEvent {
  originalEvent: Event;
  value: unknown;
}

/**
 * <int-dropdown-select> · version 1. Single-value dropdown; API mirrors PrimeNG v20 Select
 * (ported from @intelica/ui `int-select`). The option list is an embedded IntListBox in a CDK
 * overlay, so filtering, templates and keyboard behaviour are shared with List-box.
 * Deviation: `appendTo` defaults to `body` (PrimeNG: `self`), so no dialog or table clips the panel.
 * int-* extensions: `placement` (open upwards) and `baseZIndex`.
 *
 * @example
 * <int-dropdown-select [options]="cities" optionLabel="name" optionValue="code" [(ngModel)]="city"
 *                      placeholder="Select a city" filter showClear />
 */
@Component({
  selector: 'int-dropdown-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, NgTemplateOutlet, IntIcon, IntListBox],
  providers: [provideValueAccessor(() => IntDropdownSelect), provideIntOverlayContainer()],
  templateUrl: './dropdown-select.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-dropdown-select',
    '[class.int-dropdown-select--open]': 'open()',
    '[class.int-dropdown-select--disabled]': 'isDisabled()',
    '[class.int-dropdown-select--invalid]': 'isInvalid()',
    '[class.int-dropdown-select--fluid]': 'fluid()',
    '[class.int-dropdown-select--small]': 'size() === "small"',
    '[class.int-dropdown-select--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntDropdownSelect extends IntBaseControl<unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Lista de opciones (objetos o valores simples). */
  readonly options = input<readonly any[]>([]);
  /** Campo (o función) con el texto visible de cada opción. */
  readonly optionLabel = input<IntFieldAccessor | undefined>(undefined);
  /** Campo (o función) con el valor de cada opción; sin él, el valor es la opción entera. */
  readonly optionValue = input<IntFieldAccessor | undefined>(undefined);
  /** Campo (o función) que indica si una opción está deshabilitada. */
  readonly optionDisabled = input<IntFieldAccessor | undefined>(undefined);
  /** Campo que identifica una opción al comparar valores que son objetos. */
  readonly dataKey = input<string | undefined>(undefined);
  /** Texto del disparador cuando no hay valor. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Muestra un buscador sobre la lista para filtrar las opciones. */
  readonly filter = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: con `filter`, el buscador solo aparece cuando hay más opciones que este número (p. ej.
   * `5` → desde 6 opciones). Sin valor, aparece siempre.
   */
  readonly filterThreshold = input<number | undefined>(undefined);
  /** Texto del buscador (por defecto, traducción `searchPlaceholder`). */
  readonly filterPlaceholder = input<string | undefined>(undefined);
  /** Muestra el icono para borrar el valor cuando hay uno. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Marca con un check la opción elegida. */
  readonly checkmark = input(false, { transform: booleanAttribute });
  /** Texto cuando no hay opciones (por defecto, traducción `emptyMessage`). */
  readonly emptyMessage = input<string | undefined>(undefined);
  /** Texto cuando el filtro no encuentra opciones (por defecto, traducción `emptyFilterMessage`). */
  readonly emptyFilterMessage = input<string | undefined>(undefined);
  /** Alto máximo de la lista antes de hacer scroll. */
  readonly scrollHeight = input('14rem');
  /** Clase extra para el panel (se monta en el overlay, fuera del componente). */
  readonly panelStyleClass = input<string | undefined>(undefined);
  /** `id` del disparador, para asociarlo a un `<label for>`. */
  readonly inputId = input(uniqueId('int-dropdown-select'));
  /** Nombre accesible del disparador cuando no hay `<label>`. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** `id` del elemento que nombra al disparador. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /**
   * Dónde se monta el panel: `body` (por defecto), `self` (dentro del componente) o un elemento (variable de
   * template, p. ej. `[appendTo]="container"`). Diferencia con PrimeNG: allí el valor por defecto es `self`.
   * @defaultValue 'body'
   */
  readonly appendTo = input<IntAppendTo>('body');
  /**
   * Asigna el `z-index` del panel (`baseZIndex`, o 1000, el nivel de los overlays). En `false` no lo asigna y
   * se define con CSS (`.int-overlay-container`).
   * @defaultValue true
   */
  readonly autoZIndex = input(true, { transform: booleanAttribute });
  /**
   * int-* extension: `z-index` del panel cuando `autoZIndex` está activo; 0 usa 1000. Útil para quedar sobre
   * un encabezado fijo u otro overlay.
   * @defaultValue 0
   */
  readonly baseZIndex = input(0, { transform: numberAttribute });
  /**
   * int-* extension: lado preferido para abrir el panel; `top` lo abre hacia arriba (p. ej. al pie de una
   * tabla). En ambos casos cambia de lado si no hay espacio.
   * @defaultValue 'bottom'
   */
  readonly placement = input<'bottom' | 'top'>('bottom');

  /** Se emite al elegir o borrar una opción, con el evento y el valor nuevo. */
  readonly onChange = output<IntDropdownSelectChangeEvent>();
  /** Se emite al abrirse el panel. */
  readonly onShow = output<void>();
  /** Se emite al cerrarse el panel. */
  readonly onHide = output<void>();
  /** Se emite al borrar el valor con el icono de limpiar. */
  readonly onClear = output<void>();
  /** Se emite cuando el disparador recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el disparador pierde el foco. */
  readonly onBlur = output<FocusEvent>();

  protected readonly config = inject(IntConfig);
  protected readonly positions = computed(() =>
    this.placement() === 'top' ? INT_DROPUP_POSITIONS : INT_DROPDOWN_POSITIONS,
  );
  protected readonly open = signal(false);
  protected readonly triggerWidth = signal(0);
  protected readonly listBox = viewChild(IntListBox);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');

  /** Plantilla `#item`: contenido de cada opción de la lista. */
  protected readonly itemTemplate = contentChild<TemplateRef<IntListBoxItemContext>>('item');
  /** Plantilla `#selectedItem`: contenido del disparador con la opción elegida. */
  protected readonly selectedItemTemplate = contentChild<TemplateRef<{ $implicit: unknown }>>('selectedItem');

  private readonly optionConfig = computed(() => ({
    optionLabel: this.optionLabel(),
    optionValue: this.optionValue(),
    optionDisabled: this.optionDisabled(),
  }));

  protected readonly selectedOption = computed(() => {
    const value = this.modelValue();
    if (value == null) return undefined;
    return this.options().find((o) =>
      valueEquals(getOptionValue(o, this.optionConfig()), value, this.dataKey()),
    );
  });

  protected readonly showFilter = computed(() => {
    const threshold = this.filterThreshold();
    return this.filter() && (threshold == null || this.options().length > threshold);
  });

  protected readonly hasValue = computed(() => this.selectedOption() !== undefined);
  protected readonly selectedLabel = computed(() => getOptionLabel(this.selectedOption(), this.optionConfig()));

  constructor() {
    super();
    connectOverlayContainer({
      appendTo: this.appendTo,
      autoZIndex: this.autoZIndex,
      baseZIndex: this.baseZIndex,
    });
    // Keep the embedded list-box in sync and focus the selected option whenever the panel opens.
    effect(() => {
      const listBox = this.listBox();
      if (!listBox) return;
      listBox.writeValue(this.modelValue());
    });
    effect(() => {
      const listBox = this.listBox();
      if (!listBox) return;
      untracked(() => {
        listBox.activateSelected();
        if (this.showFilter()) queueMicrotask(() => listBox.focusFilter());
      });
    });
  }

  /** Abre el panel. */
  show(): void {
    if (this.isDisabled() || this.open()) return;
    this.triggerWidth.set(this.trigger().nativeElement.offsetWidth);
    this.open.set(true);
    this.onShow.emit();
  }

  /** @param focusTrigger return focus to the trigger (default true). */
  /** Cierra el panel; con `focusTrigger` devuelve el foco al disparador. */
  close(focusTrigger = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (focusTrigger) this.trigger().nativeElement.focus();
    this.onHide.emit();
  }

  /** Abre el panel si está cerrado y lo cierra si está abierto. */
  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  /** Borra el valor y emite `onChange` y `onClear`. */
  clear(event: Event): void {
    event.stopPropagation();
    this.updateValue(null);
    this.onChange.emit({ originalEvent: event, value: null });
    this.onClear.emit();
  }

  protected onListBoxChange(event: IntListBoxChangeEvent): void {
    this.updateValue(event.value);
    this.onChange.emit(event);
    this.close();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (!this.open()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.show();
      }
      return;
    }
    if (event.key === 'Tab') {
      this.close(false);
      return;
    }
    if (event.key !== 'Escape') this.listBox()?.handleKeydown(event);
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab') {
      this.close();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.trigger().nativeElement.contains(event.target as Node)) this.close(false);
  }

  protected onTriggerBlur(event: FocusEvent): void {
    if (!this.open()) this.markAsTouched();
    this.onBlur.emit(event);
  }
}
