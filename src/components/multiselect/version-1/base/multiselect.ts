import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
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
  Injector,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IntChip } from '../../../chip/version-1/base/chip';

/**
 * Target of the overlay, same values as PrimeNG's appendTo: 'self', 'body' or an element (a template
 * variable such as [appendTo]="container").
 */
export type IntMultiselectAppendTo = 'self' | 'body' | HTMLElement | ElementRef<HTMLElement>;

/** Filter match modes, same names as PrimeNG's FilterService. */
export type IntMultiselectFilterMatchMode =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte';

/** Payload of onChange (same as PrimeNG's MultiSelectChangeEvent). */
export interface IntMultiselectChangeEvent {
  originalEvent: Event | null;
  value: unknown[] | null;
  itemValue?: unknown;
}

/** Payload of onSelectAllChange. */
export interface IntMultiselectSelectAllChangeEvent {
  originalEvent: Event;
  checked: boolean;
}

/** Payload of onFilter. */
export interface IntMultiselectFilterEvent {
  originalEvent: Event;
  filter: string | null;
}

/** Payload of onFocus and onBlur. */
export interface IntMultiselectFocusEvent {
  originalEvent: Event;
}

/** Payload of onLazyLoad: indexes of the first and last rendered options. */
export interface IntMultiselectLazyLoadEvent {
  first: number;
  last: number;
}

/** Payload of onRemove. */
export interface IntMultiselectRemoveEvent {
  newValue: unknown[];
  removed: unknown;
}

/** Callbacks of the filter template context (same as PrimeNG's MultiSelectFilterOptions). */
export interface IntMultiselectFilterOptions {
  filter: (event: Event) => void;
  reset: () => void;
}

/** Context of the item and group templates: the option or the group. */
export interface IntMultiselectItemContext {
  $implicit: unknown;
}

/** Context of the selecteditems template: selected options and a function to remove one. */
export interface IntMultiselectSelectedItemsContext {
  $implicit: unknown[] | null;
  removeChip: (value: unknown, event?: Event) => void;
}

/** Context of the filter template. */
export interface IntMultiselectFilterContext {
  options: IntMultiselectFilterOptions;
}

/** Context of the loader template (virtual scroll with loading). */
export interface IntMultiselectLoaderContext {
  options: { index: number };
}

/** Context of the itemcheckboxicon template. */
export interface IntMultiselectCheckboxIconContext {
  $implicit: boolean;
  checked: boolean;
  class: string;
  partialSelected?: boolean;
}

/** Context of the headercheckboxicon template: also tells whether only some options are selected. */
export interface IntMultiselectHeaderCheckboxIconContext extends IntMultiselectCheckboxIconContext {
  partialSelected: boolean;
}

/** Context of the chipicon and removetokenicon templates. */
export interface IntMultiselectChipIconContext {
  class: string;
}

/** Group row inserted in the flat list when group is on (same shape as PrimeNG's flatOptions). */
interface GroupRow {
  optionGroup: unknown;
  group: true;
  index: number;
}

/** Same as @primeuix/utils findLastIndex (Array.prototype.findLastIndex is ES2023). */
function findLastIndex<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index--) {
    if (predicate(items[index])) return index;
  }
  return -1;
}

/** Same as @primeuix/utils resolveFieldData: a field name or a dotted path. */
function resolveField(data: unknown, field: string | undefined): unknown {
  if (data == null || !field) return undefined;
  return field
    .split('.')
    .reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), data);
}

/** Same as @primeuix/utils equals: by dataKey when given, deep equality otherwise. */
function sameValue(a: unknown, b: unknown, dataKey?: string | null): boolean {
  if (dataKey) return resolveField(a, dataKey) === resolveField(b, dataKey);
  return deepEqual(a, b);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Same as PrimeNG's FilterService: accents removed and lower case with the filter locale. */
function normalize(value: unknown, locale?: string): string {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase(locale);
}

function matches(value: unknown, filter: string, mode: IntMultiselectFilterMatchMode, locale?: string): boolean {
  if (value == null) return false;
  const text = normalize(value, locale);
  const term = normalize(filter, locale);
  switch (mode) {
    case 'startsWith':
      return text.startsWith(term);
    case 'endsWith':
      return text.endsWith(term);
    case 'equals':
      return text === term;
    case 'notEquals':
      return text !== term;
    case 'in':
      return term.split(',').some((item) => item.trim() === text);
    case 'lt':
      return Number(value) < Number(filter);
    case 'lte':
      return Number(value) <= Number(filter);
    case 'gt':
      return Number(value) > Number(filter);
    case 'gte':
      return Number(value) >= Number(filter);
    default:
      return text.includes(term);
  }
}

// Unique ids for the listbox and the options when no id is given (PrimeNG: uuid('pn_id_')).
let nextId = 0;

/**
 * <int-multiselect> · version 1. Replica of PrimeNG v20 p-multiselect without PrimeNG at runtime.
 * Selects several options of a list in an overlay with checkboxes, a "select all" header and a filter.
 * The checkboxes, the filter input and the tooltip are provisional native elements until those
 * components are done; the chips are int-chip.
 */
@Component({
  selector: 'int-multiselect',
  templateUrl: './multiselect.html',
  styleUrl: '../styles/_index.scss',
  // CDK virtual scroll replaces PrimeNG's p-scroller for virtualScroll.
  imports: [NgTemplateOutlet, ScrollingModule, IntChip],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntMultiselect), multi: true }],
  // Same root as PrimeNG: p-multiselect puts its root classes on the host element.
  host: {
    '[class]': 'classes()',
    '[attr.id]': 'id()',
    '(click)': 'onContainerClick($event)',
  },
})
export class IntMultiselect implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /** Identificador único del componente. */
  readonly id = input<string>();
  /** Texto que etiqueta el campo para accesibilidad. */
  readonly ariaLabel = input<string>();
  /** Ids de los elementos del DOM que etiquetan el campo. */
  readonly ariaLabelledBy = input<string>();
  /** Estilo en línea del panel. */
  readonly panelStyle = input<Record<string, string> | null>(null);
  /** Clase de estilo del panel. */
  readonly panelStyleClass = input<string>();
  /** Id del campo enfocable, para enlazarlo con un `<label for>`. */
  readonly inputId = input<string>();
  /** Cuando está presente, el valor no se puede editar. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Muestra las opciones agrupadas cuando `options` trae grupos con hijos. */
  readonly group = input(false, { transform: booleanAttribute });
  /** Muestra un campo para filtrar las opciones. Por defecto `true`. */
  readonly filter = input(true, { transform: booleanAttribute });
  /** Texto de ayuda del campo de filtro. */
  readonly filterPlaceHolder = input<string>();
  /** Locale con el que se compara el filtro. */
  readonly filterLocale = input<string>();
  /** Abre el panel al cargar. */
  readonly overlayVisible = input(false, { transform: booleanAttribute });
  /** Índice del campo en el orden de tabulación. Por defecto `0`. */
  readonly tabindex = input<number, unknown>(0, { transform: numberAttribute });
  /** Propiedad que identifica una opción para comparar valores. */
  readonly dataKey = input<string>();
  /** Muestra las etiquetas de lo seleccionado; si es `false`, siempre el `placeholder`. */
  readonly displaySelectedLabel = input(true, { transform: booleanAttribute });
  /** Cantidad máxima de etiquetas antes de mostrar `selectedItemsLabel`. Por defecto `3`. */
  readonly maxSelectedLabels = input<number | null, unknown>(3, {
    transform: (value: unknown) => (value == null ? null : numberAttribute(value, 0)),
  });
  /** Cantidad máxima de opciones que se pueden seleccionar. */
  readonly selectionLimit = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Texto cuando se supera `maxSelectedLabels`; `{0}` se reemplaza por la cantidad. */
  readonly selectedItemsLabel = input<string>();
  /** Muestra el checkbox del encabezado que selecciona todas las opciones. */
  readonly showToggleAll = input(true, { transform: booleanAttribute });
  /** Texto cuando el filtro no encuentra resultados. Por defecto `No results found`. */
  readonly emptyFilterMessage = input('');
  /** Texto cuando no hay opciones. Por defecto `No results found`. */
  readonly emptyMessage = input('');
  /** Limpia el filtro al cerrar el panel. */
  readonly resetFilterOnHide = input(false, { transform: booleanAttribute });
  /** Clase del icono del desplegable. Por defecto `icon icon-arrow-down`. */
  readonly dropdownIcon = input<string>();
  /** Clase del icono de quitar de cada chip. */
  readonly chipIcon = input<string>();
  /** Propiedad de la opción que se muestra como etiqueta. */
  readonly optionLabel = input<string>();
  /** Propiedad de la opción que se usa como valor. */
  readonly optionValue = input<string>();
  /** Propiedad de la opción que la deshabilita. */
  readonly optionDisabled = input<string>();
  /** Propiedad del grupo que se muestra como etiqueta. Por defecto `label`. */
  readonly optionGroupLabel = input('label');
  /** Propiedad del grupo con sus opciones. Por defecto `items`. */
  readonly optionGroupChildren = input('items');
  /** Muestra el encabezado del panel (seleccionar todo y filtro). */
  readonly showHeader = input(true, { transform: booleanAttribute });
  /** Propiedades (separadas por comas) contra las que busca el filtro. Por defecto `optionLabel`. */
  readonly filterBy = input<string>();
  /** Alto máximo de la lista; con más opciones aparece scroll. Por defecto `200px`. */
  readonly scrollHeight = input('200px');
  /** Carga las opciones bajo demanda al hacer scroll (con `virtualScroll`): emite `onLazyLoad`. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Renderiza solo las opciones visibles, para listas grandes. Requiere `virtualScrollItemSize`. */
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /** Muestra el estado de carga en lugar del icono del desplegable. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Alto de cada opción en píxeles con `virtualScroll`. */
  readonly virtualScrollItemSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Clase del icono de carga. Por defecto `icon icon-loading`. */
  readonly loadingIcon = input<string>();
  /** Texto que etiqueta el campo de filtro. */
  readonly ariaFilterLabel = input<string>();
  /** Cómo compara el filtro. Por defecto `contains`. */
  readonly filterMatchMode = input<IntMultiselectFilterMatchMode>('contains');
  /** Texto de ayuda que aparece al pasar el puntero o enfocar el campo. */
  readonly tooltip = input('');
  /** Posición del tooltip: `top`, `right` (por defecto), `bottom` o `left`. */
  readonly tooltipPosition = input<'top' | 'left' | 'right' | 'bottom'>('right');
  /** Clase de estilo del tooltip. */
  readonly tooltipStyleClass = input<string>();
  /** Enfoca el campo de filtro al abrir el panel. */
  readonly autofocusFilter = input(false, { transform: booleanAttribute });
  /** Cómo se muestra lo seleccionado: `comma` (por defecto) o `chip`. */
  readonly display = input<'comma' | 'chip'>('comma');
  /** Atributo `autocomplete` del campo de filtro. Por defecto `off`. */
  readonly autocomplete = input('off');
  /** Muestra un icono para borrar la selección. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el campo recibe el foco al cargar. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Texto cuando no hay nada seleccionado. */
  readonly placeholder = input<string>();
  /** Opciones de la lista. */
  readonly options = input<readonly unknown[] | null | undefined>([]);
  /** Valor inicial del filtro. */
  readonly filterValue = input<string | null>();
  /** Fija si todo está seleccionado; con él, el checkbox del encabezado solo emite `onSelectAllChange`. */
  readonly selectAll = input<boolean | null>(null);
  /** Enfoca la opción al pasar el puntero. Por defecto `true`. */
  readonly focusOnHover = input(true, { transform: booleanAttribute });
  /** Propiedades contra las que busca el filtro; por defecto `optionLabel`. */
  readonly filterFields = input<string[]>();
  /** Selecciona la opción al enfocarla. */
  readonly selectOnFocus = input(false, { transform: booleanAttribute });
  /** Enfoca la primera opción (o la seleccionada) al abrir el panel. */
  readonly autoOptionFocus = input(false, { transform: booleanAttribute });
  /** Resalta las opciones seleccionadas. Por defecto `true`. */
  readonly highlightOnSelect = input(true, { transform: booleanAttribute });
  /** Tamaño del campo: `small` o `large`. */
  readonly size = input<'small' | 'large'>();
  /** Variante del campo: `outlined` (por defecto) o `filled`. */
  readonly variant = input<'filled' | 'outlined'>();
  /** Ocupa todo el ancho del contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /**
   * Dónde se inserta el panel: `self` (por defecto, debajo del campo), `body` o un elemento (variable
   * de template, p. ej. `[appendTo]="container"`), para que ningún contenedor lo recorte ni lo tape.
   */
  readonly appendTo = input<IntMultiselectAppendTo>('self');
  /** Cuando está presente, el campo se muestra con estilo de error. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el componente queda deshabilitado. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Cuando está presente, el valor es obligatorio para enviar el formulario. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Atributo `name` del campo. */
  readonly name = input<string>();
  /** int-* extension: muestra el campo con borde, icono y placeholder de éxito. `invalid` tiene prioridad. */
  readonly success = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: texto junto al checkbox del encabezado que selecciona todo. Por defecto `All`;
   * vacío lo oculta.
   */
  readonly toggleAllLabel = input('All');

  /** Se emite al cambiar la selección. */
  readonly onChange = output<IntMultiselectChangeEvent>();
  /** Se emite al escribir en el filtro. */
  readonly onFilter = output<IntMultiselectFilterEvent>();
  /** Se emite cuando el campo recibe el foco. */
  readonly onFocus = output<IntMultiselectFocusEvent>();
  /** Se emite cuando el campo pierde el foco. */
  readonly onBlur = output<IntMultiselectFocusEvent>();
  /** Se emite al hacer clic en el componente. */
  readonly onClick = output<Event>();
  /** Se emite al borrar la selección con el icono de borrar. */
  readonly onClear = output<void>();
  /** Se emite cuando el panel se abre. */
  readonly onPanelShow = output<void>();
  /** Se emite cuando el panel se cierra. */
  readonly onPanelHide = output<void>();
  /** Se emite con `lazy` y `virtualScroll` para cargar las opciones visibles. */
  readonly onLazyLoad = output<IntMultiselectLazyLoadEvent>();
  /** Se emite al quitar una opción desde su chip. */
  readonly onRemove = output<IntMultiselectRemoveEvent>();
  /** Se emite al usar el checkbox del encabezado. */
  readonly onSelectAllChange = output<IntMultiselectSelectAllChangeEvent>();

  /** Template `item`: contenido de cada opción; recibe la opción. */
  protected readonly itemTemplate = contentChild<TemplateRef<IntMultiselectItemContext>>('item');
  /** Template `group`: etiqueta de cada grupo; recibe el grupo. */
  protected readonly groupTemplate = contentChild<TemplateRef<IntMultiselectItemContext>>('group');
  /** Template `loader`: fila de carga con `virtualScroll` y `loading`. */
  protected readonly loaderTemplate = contentChild<TemplateRef<IntMultiselectLoaderContext>>('loader');
  /** Template `header`: contenido sobre el encabezado del panel. */
  protected readonly headerTemplate = contentChild<TemplateRef<void>>('header');
  /** Template `filter`: reemplaza el checkbox de seleccionar todo y el filtro; recibe `options`. */
  protected readonly filterTemplate = contentChild<TemplateRef<IntMultiselectFilterContext>>('filter');
  /** Template `footer`: contenido bajo la lista. */
  protected readonly footerTemplate = contentChild<TemplateRef<void>>('footer');
  /** Template `emptyfilter`: contenido cuando el filtro no encuentra resultados. */
  protected readonly emptyFilterTemplate = contentChild<TemplateRef<void>>('emptyfilter');
  /** Template `empty`: contenido cuando no hay opciones. */
  protected readonly emptyTemplate = contentChild<TemplateRef<void>>('empty');
  /** Template `selecteditems`: contenido del campo; recibe lo seleccionado y `removeChip`. */
  protected readonly selectedItemsTemplate = contentChild<TemplateRef<IntMultiselectSelectedItemsContext>>('selecteditems');
  /** Template `loadingicon`: reemplaza el icono de carga. */
  protected readonly loadingIconTemplate = contentChild<TemplateRef<void>>('loadingicon');
  /** Template `filtericon`: reemplaza el icono del filtro. */
  protected readonly filterIconTemplate = contentChild<TemplateRef<void>>('filtericon');
  /** Template `removetokenicon`: reemplaza el icono de quitar de cada chip (igual que `chipicon`). */
  protected readonly removeTokenIconTemplate = contentChild<TemplateRef<IntMultiselectChipIconContext>>('removetokenicon');
  /** Template `chipicon`: reemplaza el icono de quitar de cada chip; recibe `class`. */
  protected readonly chipIconTemplate = contentChild<TemplateRef<IntMultiselectChipIconContext>>('chipicon');
  /** Template `clearicon`: reemplaza el icono de borrar. */
  protected readonly clearIconTemplate = contentChild<TemplateRef<void>>('clearicon');
  /** Template `dropdownicon`: reemplaza el icono del desplegable. */
  protected readonly dropdownIconTemplate = contentChild<TemplateRef<void>>('dropdownicon');
  /** Template `itemcheckboxicon`: icono del checkbox de cada opción; recibe `checked` y `class`. */
  protected readonly itemCheckboxIconTemplate = contentChild<TemplateRef<IntMultiselectCheckboxIconContext>>('itemcheckboxicon');
  /** Template `headercheckboxicon`: icono del checkbox del encabezado; recibe `checked`, `partialSelected` y `class`. */
  protected readonly headerCheckboxIconTemplate =
    contentChild<TemplateRef<IntMultiselectHeaderCheckboxIconContext>>('headercheckboxicon');

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusInputRef = viewChild<ElementRef<HTMLInputElement>>('focusInput');
  private readonly filterInputRef = viewChild<ElementRef<HTMLInputElement>>('filterInput');
  private readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlay');
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  private readonly generatedId = `int_multi_select_${nextId++}`;
  /** Id used for the listbox and the options (aria-controls, aria-activedescendant). */
  protected readonly listId = computed(() => `${this.id() ?? this.generatedId}_list`);

  /** Model value; null until the form writes one or the user selects (same as PrimeNG's modelValue). */
  protected readonly modelValue = signal<unknown[] | null>(null);
  /** Panel state; starts from overlayVisible and changes with show and hide. */
  protected readonly overlayOpen = linkedSignal(() => this.overlayVisible());
  // Cursor on the panel: the field keeps its hover look also while the panel is appended to the body.
  protected readonly panelHover = signal(false);
  /** Current filter text; starts from the filterValue input. */
  protected readonly filterText = linkedSignal<string | null>(() => this.filterValue() ?? null);
  /** Option highlighted by the keyboard or the pointer (index in visibleOptions), -1 for none. */
  protected readonly focusedOptionIndex = signal(-1);
  private readonly startRangeIndex = signal(-1);
  protected readonly focused = signal(false);
  /** Provisional tooltip shown while the pointer is over the field or it has the focus. */
  protected readonly tooltipVisible = signal(false);
  /** Disabled by the forms API (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  private searchValue = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private clickInProgress = false;
  private preventModelTouched = false;
  private shownOverlay?: HTMLElement;

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly filled = computed(() => !!this.modelValue()?.length);

  /** Element the overlay is moved to; null with appendTo="self" (it stays below the field). */
  protected readonly overlayTarget = computed<HTMLElement | null>(() => {
    const appendTo = this.appendTo();
    if (!appendTo || appendTo === 'self') return null;
    if (appendTo === 'body') return this.document.body;
    return appendTo instanceof ElementRef ? appendTo.nativeElement : appendTo;
  });

  /** All options, with group rows inserted when group is on. */
  private readonly allOptions = computed<readonly unknown[]>(() =>
    this.group() ? this.flatOptions(this.options() ?? []) : (this.options() ?? []),
  );

  /** Options shown in the list: all of them, or the ones that match the filter (same as PrimeNG). */
  protected readonly visibleOptions = computed<readonly unknown[]>(() => {
    const options = this.allOptions();
    const filter = this.filterText();
    if (!filter) return options;
    const objects = typeof (options.find((option) => !this.isOptionGroup(option)) ?? null) === 'object';
    const filtered = options.filter((option) => {
      if (this.isOptionGroup(option)) return false;
      if (!objects) return normalize(option, this.filterLocale()).includes(normalize(filter, this.filterLocale()));
      return this.searchFields().some((field) =>
        matches(resolveField(option, field), filter, this.filterMatchMode(), this.filterLocale()),
      );
    });
    if (!this.group()) return filtered;
    // Keep each group that still has matching options, as PrimeNG does.
    const groups = (this.options() ?? [])
      .map((group) => ({ group, items: this.getOptionGroupChildren(group).filter((item) => filtered.includes(item)) }))
      .filter((entry) => entry.items.length);
    return groups.reduce<unknown[]>((rows, entry, index) => {
      rows.push({ optionGroup: entry.group, group: true, index } satisfies GroupRow, ...entry.items);
      return rows;
    }, []);
  });

  /** Text of the field: labels separated by commas, selectedItemsLabel or placeholder (same as PrimeNG). */
  protected readonly label = computed(() => {
    const value = this.modelValue();
    if (value?.length && this.displaySelectedLabel()) {
      const max = this.maxSelectedLabels();
      if (max != null && value.length > max) return this.selectedItemsText();
      return value.map((item) => this.getLabelByValue(item)).join(', ');
    }
    return this.placeholder() || '';
  });

  /** Chips shown with display="chip": up to maxSelectedLabels. */
  protected readonly chipSelectedItems = computed(() => {
    const value = this.modelValue() ?? [];
    const max = this.maxSelectedLabels();
    return max != null && value.length > max ? value.slice(0, max) : value;
  });

  protected readonly selectedItemsText = computed(() => {
    const message = this.selectedItemsLabel() || '{0} items selected';
    return message.replace(/{(.*?)}/, String(this.modelValue()?.length ?? 0));
  });

  /** Options of the model, for the selecteditems template (same as PrimeNG's selectedOptions). */
  protected readonly selectedOptions = computed<unknown[] | null>(() => {
    const value = this.modelValue();
    if (!value || !this.optionValue() || !this.optionLabel()) return value;
    return this.allOptions().filter(
      (option) =>
        value.includes(resolveField(option, this.optionLabel())) || value.includes(resolveField(option, this.optionValue())),
    );
  });

  protected readonly isPlaceholder = computed(() => this.label() === (this.placeholder() || '') && !this.filled());
  protected readonly isLabelEmpty = computed(() => !this.placeholder() && !this.filled());
  protected readonly isVisibleClearIcon = computed(
    () => this.filled() && this.showClear() && !this.isDisabled() && !this.readonly(),
  );

  private readonly limitReached = computed(() => {
    const limit = this.selectionLimit();
    return !!limit && (this.modelValue()?.length ?? 0) === limit;
  });

  /** Header checkbox: every enabled visible option selected, or the selectAll input. */
  protected readonly allSelected = computed(() => {
    const selectAll = this.selectAll();
    if (selectAll != null) return selectAll;
    const options = this.visibleOptions();
    return (
      options.length > 0 &&
      options.every((option) => this.isOptionGroup(option) || this.isOptionDisabled(option) || this.isSelected(option))
    );
  });

  /** int-* extension: some, but not all, options selected (indeterminate header checkbox). */
  protected readonly partialSelected = computed(() => {
    const count = this.modelValue()?.length ?? 0;
    return !this.allSelected() && count > 0;
  });

  protected readonly toggleAllAriaLabel = computed(() =>
    this.allSelected() ? 'All items selected' : 'All items unselected',
  );

  protected readonly ariaSetSize = computed(() => this.visibleOptions().filter((option) => !this.isOptionGroup(option)).length);

  protected readonly focusedOptionId = computed(() =>
    this.focusedOptionIndex() !== -1 ? `${this.listId()}_${this.focusedOptionIndex()}` : null,
  );

  protected readonly emptyMessageLabel = computed(() => this.emptyMessage() || 'No results found');
  protected readonly emptyFilterMessageLabel = computed(() => this.emptyFilterMessage() || 'No results found');
  protected readonly hasFilter = computed(() => !!this.filterText()?.trim().length);
  protected readonly isEmpty = computed(() => this.visibleOptions().length === 0);

  protected readonly filterOptions: IntMultiselectFilterOptions = {
    filter: (event) => this.onFilterInputChange(event),
    reset: () => this.resetFilter(),
  };

  /** Bound once so the selecteditems template can remove a value. */
  protected readonly removeChip = (value: unknown, event?: Event): void => this.removeOption(value, event);

  protected readonly classes = computed(() => {
    const size = this.size();
    return [
      'int-multiselect',
      this.display() === 'chip' && 'int-multiselect--chip',
      this.variant() === 'filled' && 'int-multiselect--filled',
      size === 'small' && 'int-multiselect--small',
      size === 'large' && 'int-multiselect--large',
      this.fluid() && 'int-multiselect--fluid',
      this.focused() && 'int-multiselect--focus',
      this.overlayOpen() && 'int-multiselect--open',
      this.overlayOpen() && this.panelHover() && 'int-multiselect--hover',
      this.filled() && 'int-multiselect--filled-value',
      this.readonly() && 'int-multiselect--readonly',
      this.invalid() && 'int-multiselect--invalid',
      this.success() && !this.invalid() && 'int-multiselect--success',
      this.isDisabled() && 'int-multiselect--disabled',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly overlayClass = computed(() =>
    ['int-multiselect__overlay', this.overlayTarget() && 'int-multiselect__overlay--appended', this.panelStyleClass()]
      .filter(Boolean)
      .join(' '),
  );

  private onModelChange: (value: unknown[] | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  constructor() {
    // Same as pAutoFocus on the hidden input; and overlayVisible opens the panel on load.
    afterNextRender(() => {
      if (this.autofocus()) this.focusInputRef()?.nativeElement.focus();
      // Same as PrimeNG's autoUpdateModel: selectOnFocus + autoOptionFocus select the first option.
      if (this.selectOnFocus() && this.autoOptionFocus() && !this.filled()) {
        const index = this.findFirstFocusedOptionIndex();
        this.focusedOptionIndex.set(index);
        if (index !== -1) this.onOptionSelect(null, this.visibleOptions()[index]);
      }
      if (this.overlayOpen()) this.show();
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

    // Panel just rendered: same as PrimeNG's onOverlayAnimationStart('visible').
    afterRenderEffect(() => {
      const overlay = this.overlayRef()?.nativeElement;
      if (overlay === this.shownOverlay) return;
      this.shownOverlay = overlay;
      if (overlay) this.onOverlayShown(overlay);
    });

    // Keep the appended overlay attached to the field while the page scrolls; close on an outside click.
    const realign = () => this.alignOverlay();
    const outsideClick = (event: MouseEvent) => this.onDocumentClick(event);
    const view = this.document.defaultView;
    view?.addEventListener('scroll', realign, true);
    view?.addEventListener('resize', realign);
    this.document.addEventListener('click', outsideClick);
    inject(DestroyRef).onDestroy(() => {
      view?.removeEventListener('scroll', realign, true);
      view?.removeEventListener('resize', realign);
      this.document.removeEventListener('click', outsideClick);
      clearTimeout(this.searchTimeout);
    });
  }

  // ——— Option helpers (same names and rules as PrimeNG) ———

  protected isOptionGroup(option: unknown): option is GroupRow {
    return (
      this.group() && !!option && typeof option === 'object' && (option as Partial<GroupRow>).group === true && 'optionGroup' in option
    );
  }

  protected getOptionLabel(option: unknown): string {
    const label = this.optionLabel()
      ? resolveField(option, this.optionLabel())
      : (resolveField(option, 'label') ?? option);
    return label == null ? '' : String(label);
  }

  private getOptionValue(option: unknown): unknown {
    if (this.optionValue()) return resolveField(option, this.optionValue());
    const value = !this.optionLabel() ? resolveField(option, 'value') : undefined;
    return value !== undefined ? value : option;
  }

  protected getOptionGroupLabel(group: unknown): string {
    const label = resolveField(group, this.optionGroupLabel()) ?? group;
    return label == null ? '' : String(label);
  }

  private getOptionGroupChildren(group: unknown): unknown[] {
    const children = resolveField(group, this.optionGroupChildren());
    return Array.isArray(children) ? children : [];
  }

  private flatOptions(options: readonly unknown[]): unknown[] {
    return options.reduce<unknown[]>((rows, option, index) => {
      rows.push({ optionGroup: option, group: true, index } satisfies GroupRow, ...this.getOptionGroupChildren(option));
      return rows;
    }, []);
  }

  private searchFields(): string[] {
    return this.filterFields() ?? (this.filterBy() || this.optionLabel() || 'label').split(',');
  }

  /** dataKey compares objects unless optionValue is set (same as PrimeNG's equalityKey). */
  private equalityKey(): string | null {
    return this.optionValue() ? null : (this.dataKey() ?? null);
  }

  protected isSelected(option: unknown): boolean {
    const value = this.getOptionValue(option);
    return (this.modelValue() ?? []).some((item) => sameValue(item, value, this.equalityKey()));
  }

  protected isOptionDisabled(option: unknown): boolean {
    if (this.limitReached() && !this.isSelected(option)) return true;
    return this.isOptionMarkedDisabled(option);
  }

  private isOptionMarkedDisabled(option: unknown): boolean {
    return !!resolveField(option, this.optionDisabled() || 'disabled');
  }

  private isValidOption(option: unknown): boolean {
    return option != null && !(this.isOptionDisabled(option) || this.isOptionGroup(option));
  }

  private isValidSelectedOption(option: unknown): boolean {
    return this.isValidOption(option) && this.isSelected(option);
  }

  protected getLabelByValue(value: unknown): string {
    const option = this.allOptions().find(
      (item) => !this.isOptionGroup(item) && sameValue(this.getOptionValue(item), value, this.equalityKey()),
    );
    return option !== undefined ? this.getOptionLabel(option) : '';
  }

  protected getAriaPosInset(index: number): number {
    const groupsBefore = this.visibleOptions()
      .slice(0, index)
      .filter((option) => this.isOptionGroup(option)).length;
    return index - groupsBefore + 1;
  }

  protected optionId(index: number): string {
    return `${this.listId()}_${index}`;
  }

  // ——— Model ———

  /** Actualiza el valor y lo notifica al formulario. */
  updateModel(value: unknown[] | null): void {
    this.modelValue.set(value);
    this.onModelChange(value);
  }

  protected onOptionSelect(event: Event | null, option: unknown, isFocus = false, index = -1): void {
    if (this.isDisabled() || this.isOptionDisabled(option)) return;
    const optionValue = this.getOptionValue(option);
    const value = this.isSelected(option)
      ? (this.modelValue() ?? []).filter((item) => !sameValue(item, optionValue, this.equalityKey()))
      : [...(this.modelValue() ?? []), optionValue];
    this.updateModel(value);
    if (index !== -1) this.focusedOptionIndex.set(index);
    if (isFocus) this.focusInputRef()?.nativeElement.focus();
    this.onChange.emit({ originalEvent: event, value, itemValue: option });
  }

  private onOptionSelectRange(event: Event, start = -1, end = -1): void {
    if (start === -1) start = this.findNearestSelectedOptionIndex(end, true);
    if (end === -1) end = this.findNearestSelectedOptionIndex(start);
    if (start === -1 || end === -1) return;
    const value = this.visibleOptions()
      .slice(Math.min(start, end), Math.max(start, end) + 1)
      .filter((option) => this.isValidOption(option))
      .map((option) => this.getOptionValue(option));
    this.updateModel(value);
    this.onChange.emit({ originalEvent: event, value });
  }

  protected onOptionClick(event: MouseEvent, option: unknown, index: number): void {
    // Same as MultiSelectItem.onOptionClick: the click never reaches the container (it would toggle the panel).
    event.stopPropagation();
    event.preventDefault();
    this.onOptionSelect(event, option, false, index);
  }

  protected onOptionMouseEnter(index: number): void {
    // The hovered row is already visible: no scroll (in the viewport it would pull the list).
    if (this.focusOnHover()) this.changeFocusedOptionIndex(index, false);
  }

  protected removeOption(value: unknown, event?: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const newValue = (this.modelValue() ?? []).filter((item) => !sameValue(item, value, this.equalityKey()));
    this.updateModel(newValue);
    this.onChange.emit({ originalEvent: event ?? null, value: newValue, itemValue: value });
    this.onRemove.emit({ newValue, removed: value });
    event?.stopPropagation();
  }

  protected clear(event: Event): void {
    this.updateModel(null);
    this.onClear.emit();
    this.tooltipVisible.set(false);
    event.stopPropagation();
  }

  protected onToggleAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (this.isDisabled() || this.readonly()) {
      checkbox.checked = this.allSelected();
      return;
    }
    if (this.selectAll() != null) {
      this.onSelectAllChange.emit({ originalEvent: event, checked: !this.allSelected() });
    } else {
      // Pre-selected disabled options always stay selected (same as PrimeNG).
      const all = this.allOptions();
      const selectedDisabled = all.filter((option) => this.isSelected(option) && this.isOptionMarkedDisabled(option));
      const visible = this.allSelected()
        ? this.visibleOptions().filter((option) => !this.isValidOption(option) && this.isSelected(option))
        : this.visibleOptions().filter((option) => this.isSelected(option) || this.isValidOption(option));
      const selectedBeforeSearch =
        this.filter() && !this.allSelected() ? all.filter((option) => this.isValidSelectedOption(option)) : [];
      const values = [...selectedBeforeSearch, ...selectedDisabled, ...visible]
        .filter((option) => !this.isOptionGroup(option))
        .map((option) => this.getOptionValue(option));
      const value = values.filter((item, index) => values.findIndex((other) => sameValue(other, item)) === index);
      this.updateModel(value);
      const total = all.filter((option) => !this.isOptionGroup(option)).length;
      if (!value.length || value.length === total) {
        this.onSelectAllChange.emit({ originalEvent: event, checked: !!value.length });
      }
    }
    this.onChange.emit({ originalEvent: event, value: this.modelValue() });
    // The native checkbox already toggled itself: keep it in sync with the computed state.
    checkbox.checked = this.allSelected();
    event.stopPropagation();
  }

  // ——— Panel ———

  /** Abre el panel; con `isFocus` enfoca el campo. */
  show(isFocus = false): void {
    this.overlayOpen.set(true);
    const index =
      this.focusedOptionIndex() !== -1
        ? this.focusedOptionIndex()
        : this.autoOptionFocus()
          ? this.findFirstFocusedOptionIndex()
          : this.findSelectedOptionIndex();
    this.focusedOptionIndex.set(index);
    if (isFocus) this.focusInputRef()?.nativeElement.focus();
  }

  /** Cierra el panel; con `isFocus` devuelve el foco al campo. */
  hide(isFocus = false): void {
    const wasOpen = this.overlayOpen();
    this.overlayOpen.set(false);
    this.panelHover.set(false); // the panel leaves the DOM: no mouseleave will come

    this.focusedOptionIndex.set(-1);
    if (this.filter() && this.resetFilterOnHide()) this.resetFilter();
    if (isFocus) this.focusInputRef()?.nativeElement.focus();
    if (!wasOpen) return;
    // Same as PrimeNG's onOverlayAnimationStart('void').
    this.onModelTouched();
    this.onPanelHide.emit();
  }

  private onOverlayShown(overlay: HTMLElement): void {
    const viewport = this.viewport();
    if (viewport) {
      viewport.checkViewportSize();
      if (this.focusedOptionIndex() !== -1) viewport.scrollToIndex(this.focusedOptionIndex());
      if (this.lazy()) this.emitLazyLoad();
    } else {
      overlay.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const filterInput = this.filterInputRef()?.nativeElement;
    if (filterInput) {
      // Moving the focus to the filter must not mark the control as touched.
      this.preventModelTouched = true;
      if (this.autofocusFilter()) filterInput.focus();
    }
    this.onPanelShow.emit();
  }

  private resetFilter(): void {
    this.filterText.set(null);
  }

  protected onFilterInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterText.set(value);
    this.focusedOptionIndex.set(-1);
    this.onFilter.emit({ originalEvent: event, filter: value });
    this.viewport()?.scrollToIndex(0);
  }

  protected onLazyScroll(): void {
    if (this.lazy()) this.emitLazyLoad();
  }

  private emitLazyLoad(): void {
    const range = this.viewport()?.getRenderedRange();
    if (range) this.onLazyLoad.emit({ first: range.start, last: range.end });
  }

  // Same as PrimeNG's onContainerClick: toggles the panel unless the click comes from inside it.
  protected onContainerClick(event: MouseEvent): void {
    if (this.isDisabled() || this.loading() || this.readonly()) return;
    const input = this.focusInputRef()?.nativeElement;
    if (event.target === input) return;
    const overlay = this.overlayRef()?.nativeElement;
    if (!overlay || !overlay.contains(event.target as Node)) {
      if (this.clickInProgress) return;
      this.clickInProgress = true;
      setTimeout(() => (this.clickInProgress = false), 150);
      if (this.overlayOpen()) this.hide(true);
      else this.show(true);
    }
    input?.focus({ preventScroll: true });
    this.onClick.emit(event);
  }

  // Same as p-overlay's document click listener: a click outside the field and the panel closes it.
  private onDocumentClick(event: MouseEvent): void {
    if (!this.overlayOpen()) return;
    const target = event.target as Node;
    if (this.host.nativeElement.contains(target) || this.overlayRef()?.nativeElement.contains(target)) return;
    this.hide();
  }

  // Below the field, or above it when there is no room below (same as PrimeNG's absolutePosition).
  // Coordinates are relative to the overlay's containing block: the page, or a positioned target.
  private alignOverlay(): void {
    const overlay = this.overlayRef()?.nativeElement;
    const anchor = this.host.nativeElement;
    const view = this.document.defaultView;
    if (!overlay || !view || !this.overlayTarget()) return;
    const rect = anchor.getBoundingClientRect();
    const flip = rect.bottom + overlay.offsetHeight > view.innerHeight && rect.top > overlay.offsetHeight;
    const origin = this.containingBlockOrigin(overlay, view);
    overlay.classList.toggle('int-multiselect__overlay--top', flip);
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

  // ——— Focus ———

  protected onInputFocus(event: FocusEvent): void {
    this.focused.set(true);
    if (this.tooltip()) this.tooltipVisible.set(true);
    const index =
      this.focusedOptionIndex() !== -1
        ? this.focusedOptionIndex()
        : this.overlayOpen() && this.autoOptionFocus()
          ? this.findFirstFocusedOptionIndex()
          : -1;
    this.focusedOptionIndex.set(index);
    if (this.overlayOpen()) this.scrollInView(index);
    this.onFocus.emit({ originalEvent: event });
  }

  protected onInputBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.tooltipVisible.set(false);
    this.onBlur.emit({ originalEvent: event });
    if (!this.preventModelTouched) this.onModelTouched();
    this.preventModelTouched = false;
  }

  protected onFilterBlur(): void {
    this.focusedOptionIndex.set(-1);
  }

  protected onFilterClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.focusedOptionIndex.set(-1);
  }

  /** Elements of the panel reachable with Tab, without the two hidden sentinels. */
  private focusableElements(): HTMLElement[] {
    const overlay = this.overlayRef()?.nativeElement;
    if (!overlay) return [];
    return Array.from(
      overlay.querySelectorAll<HTMLElement>('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => !element.hasAttribute('data-hidden-focusable') && !element.matches(':disabled'));
  }

  // Focus trap of the panel: the sentinels send the focus into the panel or back to the field.
  protected onFirstHiddenFocus(event: FocusEvent): void {
    const input = this.focusInputRef()?.nativeElement;
    const next = event.relatedTarget === input ? this.focusableElements()[0] : input;
    next?.focus();
  }

  protected onLastHiddenFocus(event: FocusEvent): void {
    const input = this.focusInputRef()?.nativeElement;
    const next = event.relatedTarget === input ? this.focusableElements().at(-1) : input;
    next?.focus();
  }

  // ——— Keyboard (same handlers as PrimeNG) ———

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }
    const metaKey = event.metaKey || event.ctrlKey;
    switch (event.code) {
      case 'ArrowDown':
        this.onArrowDownKey(event);
        break;
      case 'ArrowUp':
        this.onArrowUpKey(event);
        break;
      case 'Home':
        this.onHomeKey(event);
        break;
      case 'End':
        this.onEndKey(event);
        break;
      case 'PageDown':
        this.scrollInView(this.visibleOptions().length - 1);
        event.preventDefault();
        break;
      case 'PageUp':
        this.scrollInView(0);
        event.preventDefault();
        break;
      case 'Enter':
      case 'Space':
        this.onEnterKey(event);
        break;
      case 'Escape':
        this.onEscapeKey(event);
        break;
      case 'Tab':
        this.onTabKey(event);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.startRangeIndex.set(this.focusedOptionIndex());
        break;
      default:
        if (event.code === 'KeyA' && metaKey) {
          const value = this.visibleOptions()
            .filter((option) => this.isValidOption(option))
            .map((option) => this.getOptionValue(option));
          this.updateModel(value);
          event.preventDefault();
          break;
        }
        if (!metaKey && event.key.length === 1 && event.key !== ' ') {
          if (!this.overlayOpen()) this.show();
          this.searchOptions(event.key);
          event.preventDefault();
        }
    }
  }

  protected onFilterKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowDown':
        this.onArrowDownKey(event);
        break;
      case 'ArrowUp':
        this.onArrowUpKey(event, true);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        this.focusedOptionIndex.set(-1);
        break;
      case 'Home':
        this.onHomeKey(event, true);
        break;
      case 'End':
        this.onEndKey(event, true);
        break;
      case 'Enter':
      case 'NumpadEnter':
        this.onEnterKey(event);
        break;
      case 'Escape':
        this.onEscapeKey(event);
        break;
      case 'Tab':
        this.onTabKey(event, true);
        break;
    }
  }

  private onArrowDownKey(event: KeyboardEvent): void {
    const index =
      this.focusedOptionIndex() !== -1
        ? this.findNextOptionIndex(this.focusedOptionIndex())
        : this.findFirstFocusedOptionIndex();
    if (event.shiftKey) this.onOptionSelectRange(event, this.startRangeIndex(), index);
    this.changeFocusedOptionIndex(index);
    if (!this.overlayOpen()) this.show();
    event.preventDefault();
    event.stopPropagation();
  }

  private onArrowUpKey(event: KeyboardEvent, pressedInInputText = false): void {
    if (event.altKey && !pressedInInputText) {
      if (this.focusedOptionIndex() !== -1) {
        this.onOptionSelect(event, this.visibleOptions()[this.focusedOptionIndex()]);
      }
      if (this.overlayOpen()) this.hide();
      event.preventDefault();
    } else {
      const index =
        this.focusedOptionIndex() !== -1
          ? this.findPrevOptionIndex(this.focusedOptionIndex())
          : this.findLastFocusedOptionIndex();
      if (event.shiftKey) this.onOptionSelectRange(event, index, this.startRangeIndex());
      this.changeFocusedOptionIndex(index);
      if (!this.overlayOpen()) this.show();
      event.preventDefault();
    }
    event.stopPropagation();
  }

  private onHomeKey(event: KeyboardEvent, pressedInInputText = false): void {
    if (pressedInInputText) {
      const target = event.currentTarget as HTMLInputElement;
      target.setSelectionRange(0, event.shiftKey ? target.value.length : 0);
      this.focusedOptionIndex.set(-1);
    } else {
      const index = this.findFirstOptionIndex();
      if (event.shiftKey && (event.metaKey || event.ctrlKey)) this.onOptionSelectRange(event, index, this.startRangeIndex());
      this.changeFocusedOptionIndex(index);
      if (!this.overlayOpen()) this.show();
    }
    event.preventDefault();
  }

  private onEndKey(event: KeyboardEvent, pressedInInputText = false): void {
    if (pressedInInputText) {
      const target = event.currentTarget as HTMLInputElement;
      const length = target.value.length;
      target.setSelectionRange(event.shiftKey ? 0 : length, length);
      this.focusedOptionIndex.set(-1);
    } else {
      const index = this.findLastFocusedOptionIndex();
      if (event.shiftKey && (event.metaKey || event.ctrlKey)) this.onOptionSelectRange(event, this.startRangeIndex(), index);
      this.changeFocusedOptionIndex(index);
      if (!this.overlayOpen()) this.show();
    }
    event.preventDefault();
  }

  private onEnterKey(event: KeyboardEvent): void {
    if (!this.overlayOpen()) {
      this.onArrowDownKey(event);
    } else if (this.focusedOptionIndex() !== -1) {
      if (event.shiftKey) this.onOptionSelectRange(event, this.focusedOptionIndex());
      else this.onOptionSelect(event, this.visibleOptions()[this.focusedOptionIndex()]);
    }
    event.preventDefault();
  }

  private onEscapeKey(event: KeyboardEvent): void {
    if (!this.overlayOpen()) return;
    this.hide(true);
    event.stopPropagation();
    event.preventDefault();
  }

  private onTabKey(event: KeyboardEvent, pressedInInputText = false): void {
    if (pressedInInputText) return;
    if (this.overlayOpen() && this.focusableElements().length) {
      const sentinel = event.shiftKey ? 'last' : 'first';
      this.overlayRef()?.nativeElement.querySelector<HTMLElement>(`[data-hidden-focusable="${sentinel}"]`)?.focus();
      event.preventDefault();
      return;
    }
    if (this.focusedOptionIndex() !== -1) {
      const option = this.visibleOptions()[this.focusedOptionIndex()];
      if (!this.isSelected(option)) this.onOptionSelect(event, option);
    }
    if (this.overlayOpen()) this.hide(this.filter());
  }

  // Typeahead: same 500 ms window as PrimeNG's searchOptions.
  private searchOptions(char: string): void {
    this.searchValue += char;
    const locale = this.filterLocale();
    const search = this.searchValue.toLocaleLowerCase(locale);
    const isMatch = (option: unknown) =>
      this.isValidOption(option) && this.getOptionLabel(option).toLocaleLowerCase(locale).startsWith(search);
    const options = this.visibleOptions();
    const focused = this.focusedOptionIndex();
    let index: number;
    if (focused !== -1) {
      index = options.slice(focused).findIndex(isMatch);
      index = index === -1 ? options.slice(0, focused).findIndex(isMatch) : index + focused;
    } else {
      index = options.findIndex(isMatch);
    }
    if (index === -1 && focused === -1) index = this.findFirstFocusedOptionIndex();
    if (index !== -1) this.changeFocusedOptionIndex(index);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => (this.searchValue = ''), 500);
  }

  private changeFocusedOptionIndex(index: number, scroll = true): void {
    if (this.focusedOptionIndex() === index) return;
    this.focusedOptionIndex.set(index);
    if (scroll) this.scrollInView();
  }

  // Keep the active option visible: scroll only as much as needed ('nearest'). In the virtual
  // viewport, a row that is not rendered yet is reached with scrollToIndex (it moves it to the top).
  private scrollInView(index = -1): void {
    const target = index !== -1 ? index : this.focusedOptionIndex();
    if (target === -1) return;
    afterNextRender(
      () => {
        const id = this.optionId(target);
        const element = this.overlayRef()?.nativeElement.querySelector(`[id="${id}"]`);
        if (element) element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        else this.viewport()?.scrollToIndex(target);
      },
      { injector: this.injector },
    );
  }

  private findFirstOptionIndex(): number {
    return this.visibleOptions().findIndex((option) => this.isValidOption(option));
  }

  private findLastOptionIndex(): number {
    return findLastIndex(this.visibleOptions(), (option) => this.isValidOption(option));
  }

  private findSelectedOptionIndex(): number {
    return this.filled() ? this.visibleOptions().findIndex((option) => this.isValidSelectedOption(option)) : -1;
  }

  private findFirstFocusedOptionIndex(): number {
    const selected = this.findSelectedOptionIndex();
    return selected < 0 ? this.findFirstOptionIndex() : selected;
  }

  private findLastFocusedOptionIndex(): number {
    const selected = this.filled()
      ? findLastIndex(this.visibleOptions(), (option) => this.isValidSelectedOption(option))
      : -1;
    return selected < 0 ? this.findLastOptionIndex() : selected;
  }

  private findNextOptionIndex(index: number): number {
    const next = this.visibleOptions()
      .slice(index + 1)
      .findIndex((option) => this.isValidOption(option));
    return next > -1 ? next + index + 1 : index;
  }

  private findPrevOptionIndex(index: number): number {
    const prev = index > 0 ? findLastIndex(this.visibleOptions().slice(0, index), (option) => this.isValidOption(option)) : -1;
    return prev > -1 ? prev : index;
  }

  private findNearestSelectedOptionIndex(index: number, firstCheckUp = false): number {
    if (!this.filled()) return index;
    const options = this.visibleOptions();
    const prev = () => (index > 0 ? findLastIndex(options.slice(0, index), (option) => this.isValidSelectedOption(option)) : -1);
    const next = () => {
      const found = options.slice(index + 1).findIndex((option) => this.isValidSelectedOption(option));
      return found > -1 ? found + index + 1 : -1;
    };
    const matched = firstCheckUp ? (prev() !== -1 ? prev() : next()) : next() !== -1 ? next() : prev();
    return matched > -1 ? matched : index;
  }

  // ——— Forms ———

  /** Escribe el valor del formulario. */
  writeValue(value: unknown[] | null | undefined): void {
    this.modelValue.set(value ?? null);
  }

  /** Registra el callback de cambio del formulario. */
  registerOnChange(fn: (value: unknown[] | null) => void): void {
    this.onModelChange = fn;
  }

  /** Registra el callback de "touched" del formulario. */
  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  /** Deshabilita el componente desde el formulario. */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
