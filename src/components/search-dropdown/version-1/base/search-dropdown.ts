import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IntSearch, IntSearchEvent, IntSearchSize } from '../../../search/version-1/base/search';

/** Aura: zIndex.overlay, the level of an overlay moved out of the component (no Style Guide token). */
const OVERLAY_Z_INDEX = 1000;

/**
 * Target of the panel, same values as PrimeNG's appendTo: 'self', 'body' or an element (a template
 * variable such as [appendTo]="container").
 */
export type IntSearchDropdownAppendTo = 'self' | 'body' | HTMLElement | ElementRef<HTMLElement>;

/** Payload of onSelect, same as PrimeNG's AutoCompleteSelectEvent. */
export interface IntSearchDropdownSelectEvent {
  originalEvent: Event;
  value: unknown;
}

/** Label split around the typed text, so the match can be underlined. */
export interface IntSearchDropdownHighlight {
  before: string;
  match: string;
  after: string;
}

/** Context of the item template. */
export interface IntSearchDropdownItemContext {
  $implicit: unknown;
  index: number;
  query: string;
  highlight: IntSearchDropdownHighlight;
}

/** Context of the group template. */
export interface IntSearchDropdownGroupContext {
  $implicit: unknown;
}

/** Context of the itemSkeleton template: one skeleton row, repeated itemSkeletonCount times. */
export interface IntSearchDropdownItemSkeletonContext {
  $implicit: number;
  index: number;
}

/** Context of the header and footer templates: loading while the results are on their way. */
export interface IntSearchDropdownPanelContext {
  $implicit: boolean;
  loading: boolean;
}

/** One row of the list: a group title or an option, with its label already resolved. */
interface Row {
  group: boolean;
  sticky: boolean;
  option: unknown;
  label: string;
  highlight: IntSearchDropdownHighlight;
}

let nextId = 0;

/** Same as @primeuix/utils resolveFieldData: a field name or a dotted path. */
function resolveField(data: unknown, field: string | undefined): unknown {
  if (!field || data === null || typeof data !== 'object') return data;
  return field.split('.').reduce<unknown>(
    (value, key) => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
    data,
  );
}

/**
 * <int-search-dropdown> · version 1. Replica of PrimeNG v20 p-autocomplete without PrimeNG at runtime, built on
 * <int-search>: typing asks for suggestions with completeMethod and shows them in a panel below the field, with
 * header and footer templates for the content of each project and a skeleton while the results arrive.
 */
@Component({
  selector: 'int-search-dropdown',
  templateUrl: './search-dropdown.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IntSearch, FormsModule, NgTemplateOutlet],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntSearchDropdown), multi: true }],
  // Same root as PrimeNG: p-autocomplete puts its root classes on the host element.
  host: { '[class]': 'classes()', '(click)': 'onHostClick($event)' },
})
export class IntSearchDropdown implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /** Sugerencias que se muestran en el panel; se asignan como respuesta a `completeMethod`. */
  readonly suggestions = input<readonly unknown[] | null>(null);
  /** Campo de cada sugerencia que se usa como texto (nombre o ruta con puntos). */
  readonly optionLabel = input<string>();
  /**
   * int-* extension: campo de la sugerencia que la deja fija abajo de la lista mientras se desplaza, dentro del
   * scroll (p. ej. una acción "Explore all"). Va en la última sugerencia; sigue siendo una opción que se elige con
   * clic o teclado.
   */
  readonly optionSticky = input<string>();
  /** Muestra las sugerencias agrupadas en secciones con título. */
  readonly group = input(false, { transform: booleanAttribute });
  /**
   * Campo de cada grupo que se usa como título.
   * @defaultValue 'label'
   */
  readonly optionGroupLabel = input('label');
  /**
   * Campo de cada grupo con sus sugerencias.
   * @defaultValue 'items'
   */
  readonly optionGroupChildren = input('items');
  /**
   * Cantidad mínima de caracteres para iniciar la búsqueda.
   * @defaultValue 1
   */
  readonly minLength = input(1, { transform: numberAttribute });
  /**
   * Espera en milisegundos entre la última tecla y la búsqueda.
   * @defaultValue 300
   */
  readonly delay = input(300, { transform: numberAttribute });
  /** Busca también al recibir el foco, aunque el campo esté vacío (p. ej. para mostrar recientes). */
  readonly completeOnFocus = input(false, { transform: booleanAttribute });
  /**
   * Alto máximo de la zona de resultados antes de mostrar el scroll.
   * @defaultValue '200px'
   */
  readonly scrollHeight = input('200px');
  /**
   * Dónde se coloca el panel: `self` (debajo del campo), `body` o un elemento.
   * @defaultValue 'self'
   */
  readonly appendTo = input<IntSearchDropdownAppendTo>('self');
  /**
   * Texto cuando la búsqueda no devuelve sugerencias.
   * @defaultValue 'No results found'
   */
  readonly emptyMessage = input('No results found');
  /**
   * Muestra el mensaje de vacío cuando la búsqueda no devuelve sugerencias.
   * @defaultValue true
   */
  readonly showEmptyMessage = input(true, { transform: booleanAttribute });
  /**
   * Texto que anuncia el lector de pantalla con la cantidad de resultados; `{0}` es la cantidad.
   * @defaultValue '{0} results are available'
   */
  readonly searchMessage = input('{0} results are available');
  /** Enfoca la primera sugerencia al abrir el panel. */
  readonly autoOptionFocus = input(false, { transform: booleanAttribute });
  /**
   * Enfoca la sugerencia que está bajo el puntero.
   * @defaultValue true
   */
  readonly focusOnHover = input(true, { transform: booleanAttribute });
  /** Clase extra del panel. */
  readonly panelStyleClass = input<string>();
  /**
   * Con `appendTo` en `body` o en un elemento, el componente asigna el `z-index` del panel (`baseZIndex`, o 1000,
   * el nivel de los overlays). En `false` no lo asigna y se define con `panelStyleClass`.
   * @defaultValue true
   */
  readonly autoZIndex = input(true, { transform: booleanAttribute });
  /**
   * int-* extension: `z-index` del panel montado fuera (`appendTo`) cuando `autoZIndex` está activo, tal cual
   * (en PrimeNG se suma a 1000); en `0` usa 1000. P. ej. `9` lo deja debajo de un encabezado fijo con `z-index` 10.
   * @defaultValue 0
   */
  readonly baseZIndex = input(0, { transform: numberAttribute });
  /** Id del componente; con él se arman los ids de la lista y de las opciones. */
  readonly id = input<string>();
  /**
   * int-* extension: muestra el skeleton del panel aunque no haya una búsqueda en curso (p. ej. al cambiar de
   * categoría desde el template `header`).
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: deja el panel abierto y en carga sin escribir ni enfocar, para maquetar `itemSkeleton` y el
   * `loading` de `header` y `footer`. Solo mientras se maqueta; se quita antes de subir.
   */
  readonly previewSkeleton = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: cantidad de filas del skeleton, el por defecto o el del template `itemSkeleton`; no depende de la cantidad de resultados.
   * @defaultValue 3
   */
  readonly itemSkeletonCount = input(3, { transform: numberAttribute });

  /** Tamaño del campo: `small`, `large` o sin valor para el tamaño normal. */
  readonly size = input<IntSearchSize>();
  /** Texto de ayuda que se muestra cuando el campo está vacío. */
  readonly placeholder = input<string>();
  /** Id del `<input>` interno, para asociarlo a un `<label for>`. */
  readonly inputId = input<string>();
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
  /**
   * Muestra el botón para limpiar el texto cuando el campo tiene valor.
   * @defaultValue true
   */
  readonly showClear = input(true, { transform: booleanAttribute });

  /** Se emite para pedir sugerencias, con el texto escrito en `query`. */
  readonly completeMethod = output<IntSearchEvent>();
  /** Se emite al elegir una sugerencia con clic, Enter o Tab. */
  readonly onSelect = output<IntSearchDropdownSelectEvent>();
  /**
   * int-* extension: se emite al pulsar Enter sin una sugerencia enfocada o al hacer clic en la lupa, con el texto
   * actual en `query` (p. ej. para ir a la página de resultados).
   */
  readonly onSearch = output<IntSearchEvent>();
  /** Se emite al vaciar el campo. */
  readonly onClear = output<void>();
  /** Se emite cuando el campo recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el campo pierde el foco. */
  readonly onBlur = output<FocusEvent>();
  /** Se emite al abrir el panel. */
  readonly onShow = output<void>();
  /** Se emite al cerrar el panel. */
  readonly onHide = output<void>();

  /**
   * Template `item`: contenido de una sugerencia; se repite por cada una. El componente pone la fila (padding,
   * separación entre elementos, hover y foco) y el contenido se maqueta con helpers `u-*`. Recibe la sugerencia
   * (`let-x`), `index`, `query` (el texto escrito) y `highlight` (int-* extension): el label partido alrededor del
   * texto escrito en `before`, `match` y `after`, para subrayar la coincidencia. Ej.: label "Mandated Services" y
   * texto "serv" → `before` "Mandated ", `match` "Serv", `after` "ices".
   */
  protected readonly itemTemplate = contentChild<TemplateRef<IntSearchDropdownItemContext>>('item');
  /** Template `group`: título de cada grupo con `group`. */
  protected readonly groupTemplate = contentChild<TemplateRef<IntSearchDropdownGroupContext>>('group');
  /**
   * Template `header`: contenido fijo arriba de los resultados (p. ej. filtros por categoría); recibe `loading`
   * (`true` mientras se cargan los resultados) para mostrar su propio skeleton.
   */
  protected readonly headerTemplate = contentChild<TemplateRef<IntSearchDropdownPanelContext>>('header');
  /**
   * Template `footer`: contenido fijo debajo de los resultados (p. ej. accesos "Explore"); recibe `loading`
   * (`true` mientras se cargan los resultados) para mostrar su propio skeleton.
   */
  protected readonly footerTemplate = contentChild<TemplateRef<IntSearchDropdownPanelContext>>('footer');
  /** Template `empty`: contenido cuando la búsqueda no devuelve sugerencias. */
  protected readonly emptyTemplate = contentChild<TemplateRef<void>>('empty');
  /**
   * int-* extension: template `itemSkeleton`, la fila de carga, pareja de `item`. Mientras se cargan los resultados
   * el componente la repite `itemSkeletonCount` veces (no depende de los datos) en la misma fila que usa `item` (mismo
   * padding y separación), en lugar del skeleton por defecto. Solo cubre los resultados: `header` y `footer` usan
   * `loading`. Su contenido lo define quien lo usa con helpers `u-*`; recibe `index`.
   */
  protected readonly itemSkeletonTemplate = contentChild<TemplateRef<IntSearchDropdownItemSkeletonContext>>('itemSkeleton');

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchRef = viewChild.required(IntSearch);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  private readonly generatedId = `int_search_dropdown_${nextId++}`;
  protected readonly baseId = computed(() => this.id() ?? this.generatedId);
  protected readonly listId = computed(() => `${this.baseId()}_list`);

  /** Text of the field, written by the form or by typing. */
  protected readonly query = signal('');
  /** Panel requested open by a search, the focus (completeOnFocus) or overlayVisible. */
  protected readonly overlayOpen = signal(false);
  /** A completeMethod is waiting for its suggestions; any new suggestions value ends it (PrimeNG's loading). */
  private readonly searching = linkedSignal<readonly unknown[] | null, boolean>({
    source: this.suggestions,
    computation: () => false,
  });
  private readonly formDisabled = signal(false);

  private dirty = false;
  private searchTimeout?: ReturnType<typeof setTimeout>;

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isLoading = computed(() => this.loading() || this.searching() || this.previewSkeleton());
  /** Same loading state for header and footer as for the results zone, so the three switch together. */
  protected readonly panelContext = computed<IntSearchDropdownPanelContext>(() => ({
    $implicit: this.isLoading(),
    loading: this.isLoading(),
  }));

  /** Suggestions as rows, with group titles inserted when group is on (PrimeNG's visibleOptions). */
  protected readonly rows = computed<readonly Row[]>(() => {
    const query = this.query();
    const toRow = (option: unknown, group: boolean): Row => {
      const label = String(resolveField(option, group ? this.optionGroupLabel() : this.optionLabel()) ?? '');
      const sticky = !group && !!this.optionSticky() && !!resolveField(option, this.optionSticky());
      return { group, sticky, option, label, highlight: this.highlight(label, query) };
    };
    const suggestions = this.suggestions() ?? [];
    if (!this.group()) return suggestions.map((option) => toRow(option, false));
    return suggestions.flatMap((group) => {
      const children = resolveField(group, this.optionGroupChildren());
      return [toRow(group, true), ...(Array.isArray(children) ? children.map((option) => toRow(option, false)) : [])];
    });
  });
  private readonly optionCount = computed(() => this.rows().filter((row) => !row.group).length);

  /** Option highlighted by the keyboard or the pointer (index in rows), -1 for none; reset with each result. */
  protected readonly focusedOptionIndex = linkedSignal(() =>
    this.overlayOpen() && this.autoOptionFocus() ? this.findNextOptionIndex(-1) : -1,
  );

  protected readonly showEmpty = computed(
    () =>
      !this.isLoading() &&
      !this.optionCount() &&
      !!this.query() &&
      this.suggestions() !== null &&
      (this.showEmptyMessage() || !!this.emptyTemplate()),
  );

  /** The panel is rendered when it was opened and has something to show, or always with previewSkeleton. */
  protected readonly panelVisible = computed(
    () =>
      this.previewSkeleton() ||
      (this.overlayOpen() &&
        (this.isLoading() || !!this.optionCount() || this.showEmpty() || !!this.headerTemplate() || !!this.footerTemplate())),
  );

  protected readonly activeDescendant = computed(() =>
    this.panelVisible() && this.focusedOptionIndex() !== -1 ? `${this.baseId()}_${this.focusedOptionIndex()}` : undefined,
  );

  protected readonly searchResultMessage = computed(() =>
    this.optionCount() ? this.searchMessage().replace('{0}', String(this.optionCount())) : this.emptyMessage(),
  );

  protected readonly skeleton = computed(() => Array.from({ length: Math.max(0, this.itemSkeletonCount()) }, (_, index) => index));

  /** Element the panel is moved to; null with appendTo="self" (it stays below the field). */
  protected readonly overlayTarget = computed<HTMLElement | null>(() => {
    const appendTo = this.appendTo();
    if (!appendTo || appendTo === 'self') return null;
    if (appendTo === 'body') return this.document.body;
    return appendTo instanceof ElementRef ? appendTo.nativeElement : appendTo;
  });

  protected readonly classes = computed(() => {
    const classes = ['int-search-dropdown'];
    if (this.fluid()) classes.push('int-search-dropdown--fluid');
    if (this.panelVisible()) classes.push('int-search-dropdown--open');
    return classes.join(' ');
  });

  /** z-index of a panel moved out of the block (PrimeNG's ZIndexUtils 'overlay'); the block sets it otherwise. */
  protected readonly panelZIndex = computed(() =>
    this.overlayTarget() && this.autoZIndex() ? this.baseZIndex() || OVERLAY_Z_INDEX : null,
  );

  protected readonly panelClass = computed(() =>
    ['int-search-dropdown__panel', this.overlayTarget() && 'int-search-dropdown__panel--appended', this.panelStyleClass()]
      .filter(Boolean)
      .join(' '),
  );

  private onModelChange: (value: string) => void = () => {};
  private onModelTouched: () => void = () => {};

  constructor() {
    // appendTo="body" or an element: move the panel there and place it below the field (PrimeNG's appendOverlay).
    afterRenderEffect(() => {
      const panel = this.panelRef()?.nativeElement;
      const target = this.overlayTarget();
      if (!panel || !target) return;
      if (panel.parentElement !== target) target.appendChild(panel);
      this.alignOverlay();
    });

    // Only while the panel is open: outside click closes it, and so does a scroll of the page or of a container
    // (PrimeNG's ConnectedOverlayScrollHandler), so the panel never floats over a sticky header or another
    // area; the scroll of its own results does not count. Resize keeps an appended panel aligned.
    effect((onCleanup) => {
      if (!this.panelVisible()) return;
      const view = this.document.defaultView;
      const outsideClick = (event: MouseEvent) => this.onDocumentClick(event);
      const outsideScroll = (event: Event) => {
        const panel = this.panelRef()?.nativeElement;
        if (panel && event.target instanceof Node && panel.contains(event.target)) return;
        this.hide();
      };
      const realign = () => this.alignOverlay();
      this.document.addEventListener('click', outsideClick);
      view?.addEventListener('scroll', outsideScroll, true);
      view?.addEventListener('resize', realign);
      onCleanup(() => {
        this.document.removeEventListener('click', outsideClick);
        view?.removeEventListener('scroll', outsideScroll, true);
        view?.removeEventListener('resize', realign);
      });
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimeout));
  }

  // ——— Panel ———

  /** Abre el panel; con `isFocus` enfoca el campo. */
  show(isFocus = false): void {
    if (!this.overlayOpen()) {
      this.overlayOpen.set(true);
      this.onShow.emit();
    }
    if (isFocus) this.searchRef().focus();
  }

  /** Cierra el panel; con `isFocus` devuelve el foco al campo. */
  hide(isFocus = false): void {
    if (this.overlayOpen()) {
      this.overlayOpen.set(false);
      this.onHide.emit();
    }
    this.focusedOptionIndex.set(-1);
    if (isFocus) this.searchRef().focus();
  }

  /** Same as PrimeNG's search: asks for suggestions and opens the panel to show the skeleton meanwhile. */
  private search(event: Event, query: string, source: 'input' | 'focus'): void {
    if (source === 'input' && !query.trim()) return;
    this.searching.set(true);
    this.show();
    this.completeMethod.emit({ originalEvent: event, query });
  }

  // ——— Field (events of int-search) ———

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.onModelChange(value);
  }

  // Same as PrimeNG's onInput: wait for the delay, and close below minLength.
  protected onInput(event: Event): void {
    clearTimeout(this.searchTimeout);
    const query = this.query();
    if (!query) {
      this.onClear.emit();
      this.hide();
      return;
    }
    if (query.length < this.minLength()) {
      this.hide();
      return;
    }
    this.focusedOptionIndex.set(-1);
    this.searchTimeout = setTimeout(() => this.search(event, query, 'input'), this.delay());
  }

  // A click on the field that already has the focus fires no focus event: reopen the closed panel the same way
  // (completeOnFocus), or with the text already written.
  protected onHostClick(event: MouseEvent): void {
    if (this.isDisabled() || this.overlayOpen() || !(event.target instanceof HTMLInputElement)) return;
    const query = this.query();
    if (this.completeOnFocus()) this.search(event, query, 'focus');
    else if (query.length >= this.minLength()) this.search(event, query, 'input');
  }

  protected onInputFocus(event: FocusEvent): void {
    if (this.isDisabled()) return;
    if (!this.dirty && this.completeOnFocus()) this.search(event, this.query(), 'focus');
    this.dirty = true;
    this.onFocus.emit(event);
  }

  protected onInputBlur(event: FocusEvent): void {
    this.dirty = false;
    this.onModelTouched();
    this.onBlur.emit(event);
  }

  // The X of int-search: the text is already empty (ngModelChange came first).
  protected onFieldClear(): void {
    clearTimeout(this.searchTimeout);
    this.onClear.emit();
    this.hide(true);
  }

  // Enter without a focused option or the search icon: int-search emits it, the panel closes.
  protected onFieldSearch(event: IntSearchEvent): void {
    clearTimeout(this.searchTimeout);
    this.hide();
    this.onSearch.emit(event);
  }

  // Same keys as PrimeNG's onKeyDown. preventDefault on Enter keeps int-search from emitting onSearch.
  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const open = this.panelVisible();
    switch (event.key) {
      case 'ArrowDown':
        if (!open) return;
        this.changeFocusedOptionIndex(this.findNextOptionIndex(this.focusedOptionIndex()));
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (!open) return;
        this.changeFocusedOptionIndex(
          this.focusedOptionIndex() !== -1 ? this.findPrevOptionIndex(this.focusedOptionIndex()) : this.findLastOptionIndex(),
        );
        event.preventDefault();
        break;
      case 'Home':
      case 'End':
        // The caret moves inside the text, as in PrimeNG; the option loses the focus.
        this.focusedOptionIndex.set(-1);
        break;
      case 'Enter':
        if (open && this.focusedOptionIndex() !== -1) {
          this.onOptionSelect(event, this.rows()[this.focusedOptionIndex()].option);
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (!open) return;
        this.hide(true);
        event.preventDefault();
        break;
      case 'Tab':
        if (open && this.focusedOptionIndex() !== -1) this.onOptionSelect(event, this.rows()[this.focusedOptionIndex()].option);
        else this.hide();
        break;
    }
  }

  // ——— Options ———

  protected onOptionSelect(event: Event, option: unknown): void {
    const label = String(resolveField(option, this.optionLabel()) ?? '');
    this.query.set(label);
    this.onModelChange(label);
    this.onSelect.emit({ originalEvent: event, value: option });
    this.hide(true);
  }

  protected onOptionMouseEnter(index: number): void {
    if (this.focusOnHover()) this.focusedOptionIndex.set(index);
  }

  // The focus stays in the field: clicks in the panel (options, header buttons) do not take it.
  protected onPanelMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('input, textarea')) event.preventDefault();
  }

  private changeFocusedOptionIndex(index: number): void {
    if (index === -1 || index === this.focusedOptionIndex()) return;
    this.focusedOptionIndex.set(index);
    this.panelRef()
      ?.nativeElement.querySelector(`#${CSS.escape(`${this.baseId()}_${index}`)}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private findNextOptionIndex(index: number): number {
    const rows = this.rows();
    for (let next = index + 1; next < rows.length; next++) if (!rows[next].group) return next;
    return index;
  }

  private findPrevOptionIndex(index: number): number {
    const rows = this.rows();
    for (let prev = index - 1; prev >= 0; prev--) if (!rows[prev].group) return prev;
    return index;
  }

  private findLastOptionIndex(): number {
    return this.findPrevOptionIndex(this.rows().length);
  }

  /** Splits the label around the first case-insensitive match of the query. */
  private highlight(label: string, query: string): IntSearchDropdownHighlight {
    const start = query ? label.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
    if (start === -1) return { before: label, match: '', after: '' };
    return {
      before: label.slice(0, start),
      match: label.slice(start, start + query.length),
      after: label.slice(start + query.length),
    };
  }

  // ——— Overlay position (same as int-multiselect) ———

  // Same as p-overlay's document click listener: a click outside the field and the panel closes it.
  private onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.host.nativeElement.contains(target) || this.panelRef()?.nativeElement.contains(target)) return;
    this.hide();
  }

  // Below the field, or above it when there is no room below (same as PrimeNG's absolutePosition).
  private alignOverlay(): void {
    const panel = this.panelRef()?.nativeElement;
    const view = this.document.defaultView;
    if (!panel || !view || !this.overlayTarget()) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const flip = rect.bottom + panel.offsetHeight > view.innerHeight && rect.top > panel.offsetHeight;
    const origin = this.containingBlockOrigin(panel, view);
    panel.classList.toggle('int-search-dropdown__panel--top', flip);
    panel.style.width = `${rect.width}px`;
    panel.style.left = `${rect.left - origin.left}px`;
    panel.style.top = `${(flip ? rect.top - panel.offsetHeight : rect.bottom) - origin.top}px`;
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

  // ——— ControlValueAccessor ———

  /** ControlValueAccessor: escribe el valor del formulario (el texto del campo). */
  writeValue(value: string | null | undefined): void {
    this.query.set(value ?? '');
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
