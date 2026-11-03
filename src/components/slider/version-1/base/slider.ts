import {
  afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, DestroyRef, DOCUMENT, ElementRef,
  forwardRef, inject, input, numberAttribute, output, signal, viewChild, ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Orientation of the slider. */
export type IntSliderOrientation = 'horizontal' | 'vertical';

/** Payload of onChange, same shape as PrimeNG SliderChangeEvent. */
export interface IntSliderChangeEvent {
  event?: Event;
  value?: number;
  values?: number[];
}

/** Payload of onSlideEnd, same shape as PrimeNG SliderSlideEndEvent. */
export interface IntSliderSlideEndEvent {
  originalEvent: Event;
  value?: number;
  values?: number[];
}

/**
 * <int-slider> · version 1. Replica of PrimeNG v20 p-slider without PrimeNG at runtime.
 * Slider is a component to provide input with a drag handle.
 */
@Component({
  selector: 'int-slider',
  templateUrl: './slider.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntSlider), multi: true }],
  // Same root as PrimeNG: p-slider puts its root classes and the bar click listener on the host element.
  host: { '[class]': 'classes()', '(click)': 'onBarClick($event)' },
})
export class IntSlider implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Si es `true`, el handle y la barra se animan al hacer clic sobre el track. */
  readonly animate = input(false, { transform: booleanAttribute });
  /**
   * Valor mínimo.
   * @defaultValue 0
   */
  readonly min = input(0, { transform: numberAttribute });
  /**
   * Valor máximo.
   * @defaultValue 100
   */
  readonly max = input(100, { transform: numberAttribute });
  /**
   * Orientación del slider.
   * @defaultValue 'horizontal'
   */
  readonly orientation = input<IntSliderOrientation>('horizontal');
  /** Salto con el que aumenta o disminuye el valor. */
  readonly step = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Si es `true`, se eligen dos límites (inicio y fin) y el modelo es un arreglo. */
  readonly range = input(false, { transform: booleanAttribute });
  /** Etiqueta accesible de los handles. */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta a los handles. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Índice de tabulación de los handles.
   * @defaultValue 0
   */
  readonly tabindex = input(0, { transform: numberAttribute });
  /** Si es `true`, el handle recibe el foco al cargar. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Marca el control como obligatorio. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Muestra el estado inválido. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Deshabilita el slider. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Nombre del control dentro del formulario. */
  readonly name = input<string>();

  /** Se emite cada vez que cambia el valor. */
  readonly onChange = output<IntSliderChangeEvent>();
  /** Se emite al terminar de deslizar (soltar el handle o hacer clic en la barra). */
  readonly onSlideEnd = output<IntSliderSlideEndEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly sliderHandle = viewChild<ElementRef<HTMLElement>>('sliderHandle');
  private readonly sliderHandleStart = viewChild<ElementRef<HTMLElement>>('sliderHandleStart');
  private readonly sliderHandleEnd = viewChild<ElementRef<HTMLElement>>('sliderHandleEnd');

  /** Single value (without range). */
  protected readonly value = signal(0);
  /** [start, end] values (with range); not sorted while a handle crosses the other, same as PrimeNG. */
  protected readonly values = signal<number[]>([0, 0]);
  /** Handle positions in %. A signal (not computed): without step the drag keeps the raw pointer position. */
  protected readonly handleValue = signal(0);
  protected readonly handleValues = signal<number[]>([0, 0]);
  /** Handle being dragged or moved with the keyboard; on top of the other one in range mode. */
  protected readonly handleIndex = signal(0);
  protected readonly dragging = signal(false);
  /** Disabled state set by the form (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isVertical = computed(() => this.orientation() === 'vertical');

  protected readonly classes = computed(() => {
    const classes = ['int-slider', `int-slider--${this.orientation()}`];
    // PrimeNG removes p-slider-animate while dragging, so the handle follows the pointer without delay.
    if (this.animate() && !this.dragging()) classes.push('int-slider--animate');
    if (this.isDisabled()) classes.push('int-slider--disabled');
    if (this.invalid()) classes.push('int-slider--invalid');
    return classes.join(' ');
  });

  /** Position and size of the range bar, same expressions as the PrimeNG template. */
  protected readonly rangeStyle = computed(() => {
    const vertical = this.isVertical();
    if (!this.range()) {
      return vertical ? { height: `${this.handleValue()}%` } : { width: `${this.handleValue()}%` };
    }
    const [start, end] = this.handleValues();
    const offset = `${Math.min(start, end)}%`;
    const size = `${Math.abs(start - end)}%`;
    return vertical ? { bottom: offset, height: size } : { 'inset-inline-start': offset, width: size };
  });

  protected readonly handleStyle = computed(() =>
    this.isVertical() ? { bottom: `${this.handleValue()}%` } : { 'inset-inline-start': `${this.handleValue()}%` },
  );

  protected readonly startHandleStyle = computed(() => {
    const start = this.handleValues()[0];
    return this.isVertical() ? { bottom: `${start}%` } : { 'inset-inline-start': `${start > 100 ? 100 : start}%` };
  });

  protected readonly endHandleStyle = computed(() => {
    const end = this.handleValues()[1];
    return this.isVertical() ? { bottom: `${end}%` } : { 'inset-inline-start': `${end}%` };
  });

  // Pointer data taken when a drag or a bar click starts (PrimeNG updateDomData / onDragStart).
  private initX = 0;
  private initY = 0;
  private barWidth = 0;
  private barHeight = 0;
  private startX = 0;
  private startY = 0;
  private startHandleValue = 0;
  /** Set on handle mousedown so the click that follows on the host is not taken as a bar click. */
  private sliderHandleClick = false;
  private removeDragListeners: (() => void) | null = null;

  private onModelChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Same as PrimeNG pAutoFocus on the first handle.
    afterNextRender(() => {
      if (this.autofocus()) (this.sliderHandle() ?? this.sliderHandleStart())?.nativeElement.focus();
    });
    inject(DestroyRef).onDestroy(() => this.unbindDragListeners());
  }

  protected onMouseDown(event: MouseEvent, index = 0): void {
    if (this.isDisabled()) {
      return;
    }
    this.dragging.set(true);
    this.updateDomData();
    this.sliderHandleClick = true;
    this.handleIndex.set(this.range() && this.handleValues()[0] === this.max() ? 0 : index);
    this.bindDragListeners();
    (event.target as HTMLElement).focus();
    event.preventDefault();
  }

  protected onDragStart(event: TouchEvent, index = 0): void {
    if (this.isDisabled()) {
      return;
    }
    const touch = event.changedTouches[0];
    this.startHandleValue = this.range() ? this.handleValues()[index] : this.handleValue();
    this.dragging.set(true);
    this.handleIndex.set(this.range() && this.handleValues()[0] === this.max() ? 0 : index);
    const element = this.host.nativeElement;
    if (this.isVertical()) {
      this.startY = touch.clientY;
      this.barHeight = element.offsetHeight;
    } else {
      this.startX = touch.clientX;
      this.barWidth = element.offsetWidth;
    }
    event.preventDefault();
  }

  protected onDrag(event: TouchEvent): void {
    if (this.isDisabled()) {
      return;
    }
    const touch = event.changedTouches[0];
    const handleValue = this.isVertical()
      ? Math.floor(((this.startY - touch.clientY) * 100) / this.barHeight) + this.startHandleValue
      : Math.floor(((touch.clientX - this.startX) * 100) / this.barWidth) + this.startHandleValue;
    this.setValueFromHandle(event, handleValue);
    event.preventDefault();
  }

  protected onDragEnd(event: TouchEvent): void {
    if (this.isDisabled()) {
      return;
    }
    this.dragging.set(false);
    this.emitSlideEnd(event);
    event.preventDefault();
  }

  /**
   * Click on the track (host listener): moves the last used handle there (PrimeNG keeps handleIndex, it does not pick
   * the nearest one), unless the click came from a handle.
   */
  protected onBarClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      return;
    }
    if (!this.sliderHandleClick) {
      this.updateDomData();
      this.setValueFromHandle(event, this.calculateHandleValue(event));
      this.emitSlideEnd(event);
    }
    this.sliderHandleClick = false;
  }

  /** Same keys as PrimeNG onKeyDown: arrows ±step, PageUp/PageDown ±10 (or ±step), Home/End to min/max. */
  protected onKeyDown(event: KeyboardEvent, index = 0): void {
    if (this.isDisabled()) {
      return;
    }
    this.handleIndex.set(index);
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowLeft':
        this.decrementValue(event, index);
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowRight':
        this.incrementValue(event, index);
        event.preventDefault();
        break;
      case 'PageDown':
        this.decrementValue(event, index, true);
        event.preventDefault();
        break;
      case 'PageUp':
        this.incrementValue(event, index, true);
        event.preventDefault();
        break;
      case 'Home':
        this.updateValue(this.min(), event);
        event.preventDefault();
        break;
      case 'End':
        this.updateValue(this.max(), event);
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  private decrementValue(event: Event, index: number, pageKey = false): void {
    this.updateValue(this.keyTarget(index) - this.keyStep(pageKey), event);
  }

  private incrementValue(event: Event, index: number, pageKey = false): void {
    this.updateValue(this.keyTarget(index) + this.keyStep(pageKey), event);
  }

  private keyTarget(index: number): number {
    return this.range() ? (this.values()[index] ?? 0) : this.value();
  }

  /** PrimeNG: step if set; otherwise 10 for PageUp/PageDown (single value only) and 1 for the rest. */
  private keyStep(pageKey: boolean): number {
    const step = this.step();
    if (step) return step;
    return pageKey && !this.range() ? 10 : 1;
  }

  // Document listeners only while a mouse drag is active; removed on mouseup and on destroy.
  private bindDragListeners(): void {
    if (this.removeDragListeners) {
      return;
    }
    const onMove = (event: MouseEvent) => {
      if (this.dragging()) this.setValueFromHandle(event, this.calculateHandleValue(event));
    };
    const onUp = (event: MouseEvent) => {
      if (this.dragging()) {
        this.dragging.set(false);
        this.emitSlideEnd(event);
      }
      this.unbindDragListeners();
    };
    this.document.addEventListener('mousemove', onMove);
    this.document.addEventListener('mouseup', onUp);
    this.removeDragListeners = () => {
      this.document.removeEventListener('mousemove', onMove);
      this.document.removeEventListener('mouseup', onUp);
    };
  }

  private unbindDragListeners(): void {
    this.removeDragListeners?.();
    this.removeDragListeners = null;
  }

  private emitSlideEnd(originalEvent: Event): void {
    if (this.range()) this.onSlideEnd.emit({ originalEvent, values: this.values() });
    else this.onSlideEnd.emit({ originalEvent, value: this.value() });
  }

  private setValueFromHandle(event: Event, handleValue: number): void {
    const newValue = this.getValueFromHandle(handleValue);
    const index = this.handleIndex();
    if (this.step()) {
      this.handleStepChange(newValue, this.range() ? this.values()[index] : this.value());
      return;
    }
    if (this.range()) {
      this.handleValues.update((values) => values.map((value, i) => (i === index ? handleValue : value)));
    } else {
      this.handleValue.set(handleValue);
    }
    this.updateValue(newValue, event);
  }

  /** Moves from oldValue towards newValue in whole steps, same as PrimeNG (no event in onChange). */
  private handleStepChange(newValue: number, oldValue: number): void {
    const step = this.step() as number;
    const diff = newValue - oldValue;
    let value = oldValue;
    if (diff < 0) value = oldValue + Math.ceil(newValue / step - oldValue / step) * step;
    else if (diff > 0) value = oldValue + Math.floor(newValue / step - oldValue / step) * step;
    this.updateValue(value);
  }

  private updateDomData(): void {
    const element = this.host.nativeElement;
    const rect = element.getBoundingClientRect();
    const view = this.document.defaultView;
    this.initX = rect.left + (view?.scrollX ?? 0);
    this.initY = rect.top + (view?.scrollY ?? 0);
    this.barWidth = element.offsetWidth;
    this.barHeight = element.offsetHeight;
  }

  /** Pointer position in % of the track (from the bottom when vertical, from the right in RTL). */
  private calculateHandleValue(event: MouseEvent): number {
    if (this.isVertical()) {
      return ((this.initY + this.barHeight - event.pageY) * 100) / this.barHeight;
    }
    const rtl = getComputedStyle(this.host.nativeElement).direction === 'rtl';
    return rtl
      ? ((this.initX + this.barWidth - event.pageX) * 100) / this.barWidth
      : ((event.pageX - this.initX) * 100) / this.barWidth;
  }

  private getValueFromHandle(handleValue: number): number {
    return (this.max() - this.min()) * (handleValue / 100) + this.min();
  }

  /** Rounds to the decimals of step, or to an integer without decimals (PrimeNG getNormalizedValue). */
  private getNormalizedValue(value: number): number {
    const step = this.step();
    const decimals = step && Math.floor(step) !== step ? (step.toString().split('.')[1]?.length ?? 0) : 0;
    return decimals > 0 ? +value.toFixed(decimals) : Math.floor(value);
  }

  /** Clamps to [min, max], writes the model, emits onChange and keeps the focus on the moved handle. */
  private updateValue(value: number, event?: Event): void {
    const min = this.min();
    const max = this.max();
    if (this.range()) {
      const index = this.handleIndex();
      if (index === 0) {
        if (value < min) value = min;
        else if (value > this.values()[1] && value > max) value = max;
        this.sliderHandleStart()?.nativeElement.focus();
      } else {
        if (value > max) value = max;
        else if (value < min) value = min;
        this.sliderHandleEnd()?.nativeElement.focus();
      }
      const normalized = this.getNormalizedValue(value);
      this.values.update((values) => values.map((current, i) => (i === index ? normalized : current)));
      const [start, end] = this.values();
      this.onModelChange([Math.min(start, end), Math.max(start, end)]);
      this.onChange.emit({ event, values: this.values() });
    } else {
      if (value < min) value = min;
      else if (value > max) value = max;
      this.value.set(this.getNormalizedValue(value));
      this.onModelChange(this.value());
      this.onChange.emit({ event, value: this.value() });
      this.sliderHandle()?.nativeElement.focus();
    }
    this.updateHandleValue();
  }

  /** Handle positions in % from the values (PrimeNG updateHandleValue). */
  private updateHandleValue(): void {
    const min = this.min();
    const max = this.max();
    const span = max - min;
    if (this.range()) {
      const [start, end] = this.values();
      this.handleValues.set([
        ((start < min ? 0 : start - min) * 100) / span,
        ((end > max ? 100 : end - min) * 100) / span,
      ]);
    } else {
      const value = this.value();
      this.handleValue.set(value < min ? 0 : value > max ? 100 : ((value - min) * 100) / span);
    }
  }

  /** ControlValueAccessor: escribe el valor del formulario (número, o `[inicio, fin]` con `range`). */
  writeValue(value: unknown): void {
    if (this.range()) this.values.set(Array.isArray(value) ? [...value] : [0, 0]);
    else this.value.set(typeof value === 'number' ? value : 0);
    this.updateHandleValue();
  }

  /** ControlValueAccessor: registra la función que avisa los cambios al formulario. */
  registerOnChange(fn: (value: unknown) => void): void {
    this.onModelChange = fn;
  }

  /** ControlValueAccessor: registra la función que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: deshabilita el slider desde el formulario. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
