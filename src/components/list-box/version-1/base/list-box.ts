import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

import {
  IntBaseControl,
  IntConfig,
  IntFieldAccessor,
  IntIcon,
  filterOptions,
  getOptionLabel,
  getOptionValue,
  isOptionDisabled,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import { IntInputText } from '../../../input/version-1/base/input-text';

export interface IntListBoxChangeEvent {
  originalEvent: Event;
  value: unknown;
}

/** Payload of `onDblClick`: the option and its value (PrimeNG ListboxDoubleClickEvent). */
export interface IntListBoxDoubleClickEvent {
  originalEvent: MouseEvent;
  option: unknown;
  value: unknown;
}

export interface IntListBoxItemContext<T = any> {
  $implicit: T;
  index: number;
  selected: boolean;
}

/**
 * <int-list-box> · version 1. Selectable list (single or multiple) with filter and keyboard
 * navigation (WAI-ARIA listbox). API mirrors PrimeNG v20 Listbox (ported from @intelica/ui `int-listbox`).
 * Also the option engine of Dropdown-select: in `embedded` mode keyboard focus stays on the host
 * component, which forwards key events through `handleKeydown`.
 *
 * @example
 * <int-list-box [options]="countries" optionLabel="name" optionValue="code" [(ngModel)]="code" filter />
 * <int-list-box [options]="brands" multiple checkmark [(ngModel)]="selected">
 *   <ng-template #item let-brand>{{ brand.name }}</ng-template>
 * </int-list-box>
 */
@Component({
  selector: 'int-list-box',
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, NgTemplateOutlet, IntIcon, IntInputText],
  providers: [provideValueAccessor(() => IntListBox)],
  templateUrl: './list-box.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-list-box',
    '[class.int-list-box--embedded]': 'embedded()',
    '[class.int-list-box--disabled]': 'isDisabled()',
    '[class.int-list-box--invalid]': 'isInvalid()',
    '[class.int-list-box--fluid]': 'fluid()',
    '[class.int-list-box--dragdrop]': '!dragDisabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntListBox extends IntBaseControl<unknown> {
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
  /** Campo que identifica una opción al comparar valores que son objetos (p. ej. `'id'`). */
  readonly dataKey = input<string | undefined>(undefined);
  /** Permite elegir varias opciones; el modelo es un arreglo. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Muestra un buscador sobre la lista para filtrar las opciones. */
  readonly filter = input(false, { transform: booleanAttribute });
  /** Texto del buscador (por defecto, traducción `searchPlaceholder`). */
  readonly filterPlaceholder = input<string | undefined>(undefined);
  /** Marca con un check las opciones elegidas. */
  readonly checkmark = input(false, { transform: booleanAttribute });
  /** Texto cuando no hay opciones (por defecto, traducción `emptyMessage`). */
  readonly emptyMessage = input<string | undefined>(undefined);
  /** Texto cuando el filtro no encuentra opciones (por defecto, traducción `emptyFilterMessage`). */
  readonly emptyFilterMessage = input<string | undefined>(undefined);
  /** Alto máximo de la lista antes de hacer scroll. */
  readonly scrollHeight = input('14rem');
  /** Nombre accesible de la lista cuando no hay `<label>`. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** `id` del elemento que nombra la lista. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /** Plantilla de las opciones, como alternativa a una `<ng-template #item>` proyectada. */
  readonly itemTemplate = input<TemplateRef<IntListBoxItemContext> | undefined>(undefined);
  /** Uso interno de Dropdown-select: lista sin borde cuyo teclado maneja el componente que la contiene. */
  readonly embedded = input(false, { transform: booleanAttribute });
  /**
   * Con `multiple`, un clic reemplaza la selección por esa opción; Ctrl o ⌘ + clic la suma o la quita (como en
   * PrimeNG). Sin él, cada clic suma o quita.
   */
  readonly metaKeySelection = input(false, { transform: booleanAttribute });
  /**
   * Permite reordenar las opciones arrastrándolas (CDK drag-drop). Reordena también el arreglo de `options`, como
   * PrimeNG, y emite `onDrop`. Dentro de un `cdkDropListGroup` la lista se conecta con las otras del grupo. No se
   * arrastra mientras el filtro tiene texto.
   */
  readonly dragdrop = input(false, { transform: booleanAttribute });

  /** Se emite al elegir o quitar una opción, con el evento y el valor nuevo. */
  readonly onChange = output<IntListBoxChangeEvent>();
  /** Se emite al escribir en el buscador, con el texto del filtro. */
  readonly onFilter = output<{ originalEvent: Event; filter: string }>();
  /** Se emite con doble clic sobre una opción habilitada (p. ej. para pasarla a otra lista). */
  readonly onDblClick = output<IntListBoxDoubleClickEvent>();
  /**
   * Se emite al soltar una opción arrastrada (`dragdrop`), con el evento del CDK. En la misma lista ya quedó
   * reordenada; entre listas de un grupo, el traspaso lo hace la app.
   */
  readonly onDrop = output<CdkDragDrop<unknown[]>>();

  protected readonly config = inject(IntConfig);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  /** Plantilla `#item`: contenido de cada opción (recibe la opción, su índice y si está elegida). */
  private readonly projectedItem = contentChild<TemplateRef<IntListBoxItemContext>>('item');

  readonly listId = uniqueId('int-list-box');
  readonly focusedIndex = signal(-1);
  protected readonly filterValue = signal('');
  protected readonly listFocused = signal(false);

  protected readonly resolvedItemTemplate = computed(() => this.itemTemplate() ?? this.projectedItem());
  private readonly optionConfig = computed(() => ({
    optionLabel: this.optionLabel(),
    optionValue: this.optionValue(),
    optionDisabled: this.optionDisabled(),
  }));

  /** Options in their current order: follows `options` and changes when an option is dragged (dragdrop). */
  private readonly orderedOptions = linkedSignal(() => [...this.options()]);
  /** An option is being dragged: the others slide to make room (int-list-box__list--dragging). */
  protected readonly dragging = signal(false);
  /** Last option clicked or toggled: start of a Shift range selection. */
  private rangeAnchor = -1;

  readonly visibleOptions = computed(() =>
    this.filter()
      ? filterOptions(this.orderedOptions(), this.filterValue(), this.optionConfig(), this.config.locale())
      : [...this.orderedOptions()],
  );
  /** Dragging is off while disabled or while the filter hides options (indexes would not match). */
  protected readonly dragDisabled = computed(() => !this.dragdrop() || this.isDisabled() || !!this.filterValue());

  readonly activeDescendant = computed(() => {
    const i = this.focusedIndex();
    return i > -1 && i < this.visibleOptions().length ? this.optionId(i) : null;
  });

  protected optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  /** Texto visible de una opción (según `optionLabel`). */
  label(option: unknown): string {
    return getOptionLabel(option, this.optionConfig());
  }

  /** Indica si una opción está deshabilitada (según `optionDisabled`). */
  isDisabledOption(option: unknown): boolean {
    return isOptionDisabled(option, this.optionConfig());
  }

  /** Indica si una opción forma parte del valor actual. */
  isSelected(option: unknown): boolean {
    const optionValue = getOptionValue(option, this.optionConfig());
    const value = this.modelValue();
    if (this.multiple()) {
      return Array.isArray(value) && value.some((v) => valueEquals(v, optionValue, this.dataKey()));
    }
    return value != null && valueEquals(value, optionValue, this.dataKey());
  }

  /** Elige (o quita, con `multiple`) una opción, como un clic; respeta Shift, Ctrl/⌘ y `metaKeySelection`. */
  selectOption(event: Event, option: unknown, index: number): void {
    if (this.isDisabled() || this.isDisabledOption(option)) return;
    this.focusedIndex.set(index);
    const optionValue = getOptionValue(option, this.optionConfig());
    const modifiers = event as Partial<MouseEvent>;
    let next: unknown;
    if (this.multiple() && modifiers.shiftKey && this.rangeAnchor > -1) {
      next = this.rangeValues(this.rangeAnchor, index);
    } else if (this.multiple()) {
      const current = Array.isArray(this.modelValue()) ? (this.modelValue() as unknown[]) : [];
      const additive = !this.metaKeySelection() || modifiers.metaKey || modifiers.ctrlKey;
      if (!additive) next = [optionValue];
      else
        next = this.isSelected(option)
          ? current.filter((v) => !valueEquals(v, optionValue, this.dataKey()))
          : [...current, optionValue];
      this.rangeAnchor = index;
    } else {
      next = optionValue;
    }
    this.updateValue(next);
    this.onChange.emit({ originalEvent: event, value: next });
  }

  /** Values of the enabled visible options between two indexes, both included (Shift range selection). */
  private rangeValues(from: number, to: number): unknown[] {
    const [start, end] = from <= to ? [from, to] : [to, from];
    return this.visibleOptions()
      .slice(start, end + 1)
      .filter((o) => !this.isDisabledOption(o))
      .map((o) => getOptionValue(o, this.optionConfig()));
  }

  protected onOptionDblClick(event: MouseEvent, option: unknown): void {
    if (this.isDisabled() || this.isDisabledOption(option)) return;
    this.onDblClick.emit({ originalEvent: event, option, value: getOptionValue(option, this.optionConfig()) });
  }

  /** Same list: reorder (also the consumer's array, as PrimeNG). Always emits onDrop for cross-list moves. */
  protected onDropped(event: CdkDragDrop<unknown[]>): void {
    if (event.previousContainer === event.container && event.previousIndex !== event.currentIndex) {
      const next = [...this.orderedOptions()];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      this.orderedOptions.set(next);
      const source = this.options();
      if (Array.isArray(source) && !Object.isFrozen(source)) moveItemInArray(source, event.previousIndex, event.currentIndex);
      this.focusedIndex.set(event.currentIndex);
    }
    this.onDrop.emit(event);
  }

  /** Keyboard contract shared with Dropdown-select (WAI-ARIA listbox pattern). */
  handleKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const options = this.visibleOptions();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const from = this.focusedIndex();
        this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
        // Shift + arrows extends the selection from the anchor (multiple), as PrimeNG.
        if (event.shiftKey && this.multiple() && this.focusedIndex() > -1) {
          if (this.rangeAnchor < 0) this.rangeAnchor = from > -1 ? from : this.focusedIndex();
          const next = this.rangeValues(this.rangeAnchor, this.focusedIndex());
          this.updateValue(next);
          this.onChange.emit({ originalEvent: event, value: next });
        }
        break;
      }
      case 'Home':
        if (event.target instanceof HTMLInputElement) return;
        this.focusedIndex.set(this.nextEnabled(-1, 1));
        break;
      case 'End':
        if (event.target instanceof HTMLInputElement) return;
        this.focusedIndex.set(this.nextEnabled(options.length, -1));
        break;
      case 'Enter':
        if (this.focusedIndex() < 0) return;
        this.selectOption(event, options[this.focusedIndex()], this.focusedIndex());
        break;
      case ' ':
        if (event.target instanceof HTMLInputElement || this.focusedIndex() < 0) return;
        this.selectOption(event, options[this.focusedIndex()], this.focusedIndex());
        break;
      default:
        return;
    }
    event.preventDefault();
    this.scrollToFocused();
  }

  /** Focuses the selected option (or the first enabled one) — used when a host opens the list. */
  activateSelected(): void {
    const options = this.visibleOptions();
    const selected = options.findIndex((o) => this.isSelected(o) && !this.isDisabledOption(o));
    this.focusedIndex.set(selected > -1 ? selected : this.nextEnabled(-1, 1));
    this.scrollToFocused();
  }

  /** Enfoca el buscador (con `filter`). */
  focusFilter(): void {
    this.el.nativeElement.querySelector<HTMLInputElement>('.int-list-box__filter input')?.focus();
  }

  /** Embedded (Dropdown-select): keep focus on the host trigger. Note: a handler returning `false` would preventDefault. */
  protected onOptionMousedown(event: MouseEvent): void {
    if (this.embedded()) event.preventDefault();
  }

  protected onFilterInput(event: Event): void {
    const filter = (event.target as HTMLInputElement).value;
    this.filterValue.set(filter);
    this.focusedIndex.set(this.nextEnabled(-1, 1));
    this.onFilter.emit({ originalEvent: event, filter });
  }

  protected onListFocus(): void {
    this.listFocused.set(true);
    if (this.focusedIndex() < 0) this.activateSelected();
  }

  protected onListBlur(): void {
    this.listFocused.set(false);
    this.markAsTouched();
  }

  private moveFocus(direction: 1 | -1): void {
    const next = this.nextEnabled(this.focusedIndex(), direction);
    if (next > -1) this.focusedIndex.set(next);
  }

  private nextEnabled(from: number, direction: 1 | -1): number {
    const options = this.visibleOptions();
    for (let i = from + direction; i >= 0 && i < options.length; i += direction) {
      if (!this.isDisabledOption(options[i])) return i;
    }
    return from >= 0 && from < options.length ? from : -1;
  }

  private scrollToFocused(): void {
    afterNextRender(
      () => {
        const id = this.activeDescendant();
        if (id) this.el.nativeElement.querySelector(`#${id}`)?.scrollIntoView?.({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }
}
