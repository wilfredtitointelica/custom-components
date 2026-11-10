import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  numberAttribute,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { IntPaginator, IntPaginatorAppendTo, IntPaginatorPageChangeEvent, IntPaginatorRowsPerPageOption, IntPaginatorTemplateContext } from '../../../paginator/version-1/base/paginator';

/** Node of the tree: same shape as PrimeNG's TreeNode. `data` holds the row values read by the columns. */
export interface IntTreeNode<T = unknown> {
  key?: string;
  label?: string;
  data?: T;
  icon?: string;
  children?: IntTreeNode<T>[];
  /** false = has children to load lazily; the toggler is shown although children is empty. */
  leaf?: boolean;
  expanded?: boolean;
  type?: string;
  parent?: IntTreeNode<T> | null;
  styleClass?: string;
  selectable?: boolean;
}

/** Row rendered by the body: the node plus its place in the tree (PrimeNG's serialized TreeTableNode). */
export interface IntTreetableNode<T = unknown> {
  node: IntTreeNode<T>;
  parent: IntTreeNode<T> | null;
  level: number;
  visible: boolean;
}

/** Dynamic column of the columns input. */
export interface IntTreetableColumn {
  field?: string;
  header?: string;
  [key: string]: unknown;
}

export interface IntTreetableSortMeta {
  field: string;
  order: number;
}

export interface IntTreetableFilterMetadata {
  value: unknown;
  matchMode?: IntTreetableFilterMatchMode;
}

export type IntTreetableFilters = Record<string, IntTreetableFilterMetadata>;

/** Match modes of PrimeNG's FilterService that the tree table resolves natively. */
export type IntTreetableFilterMatchMode =
  | 'startsWith'
  | 'contains'
  | 'notContains'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte';

export type IntTreetableSelectionMode = 'single' | 'multiple' | 'checkbox';

/** Checkbox state per node key, same as PrimeNG's selectionKeys. */
export type IntTreetableSelectionKeys = Record<string, { checked: boolean; partialChecked: boolean }>;

/** Icon classes of int-treetable-sort-icon per sort state (int-* extension). */
export interface IntTreetableSortIcons {
  unsorted?: string;
  ascending?: string;
  descending?: string;
}

export type IntTreetableTrackBy =(index: number, row: IntTreetableNode) => unknown;

export interface IntTreetableTemplateContext {
  $implicit: readonly IntTreetableColumn[] | undefined;
}

export interface IntTreetableBodyContext {
  $implicit: IntTreetableNode;
  node: IntTreeNode;
  rowData: unknown;
  columns: readonly IntTreetableColumn[] | undefined;
}

export interface IntTreetableSortEvent {
  data?: IntTreeNode[];
  mode?: 'single' | 'multiple';
  field?: string | null;
  order?: number;
  multiSortMeta?: IntTreetableSortMeta[] | null;
}

export interface IntTreetableLazyLoadEvent {
  first: number;
  rows: number;
  sortField: string | null;
  sortOrder: number;
  filters: IntTreetableFilters;
  globalFilter: unknown;
  multiSortMeta: IntTreetableSortMeta[] | null;
  forceUpdate: () => void;
}

export interface IntTreetableFilterEvent {
  filters: IntTreetableFilters;
  filteredValue: IntTreeNode[] | undefined;
}

export interface IntTreetableNodeEvent {
  originalEvent: Event;
  node: IntTreeNode;
  type?: 'row';
}

export interface IntTreetableHeaderCheckboxToggleEvent {
  originalEvent: Event;
  checked: boolean;
}

/** Same shape as PrimeNG's onPage payload. */
export interface IntTreetablePageEvent {
  first: number;
  rows: number;
}

/** Context of the togglericon, sorticon, checkboxicon and headercheckboxicon templates. */
export interface IntTreetableIconContext {
  $implicit: boolean | number;
  partialSelected?: boolean;
}

/** Reads `a.b.c` from an object, like PrimeNG's resolveFieldData. */
function resolveFieldData(data: unknown, field: string | null | undefined): unknown {
  if (data == null || !field) return null;
  let value: unknown = data;
  for (const part of field.split('.')) {
    if (value == null || typeof value !== 'object') return null;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Text and number constraints of PrimeNG's FilterService. */
function matches(
  mode: IntTreetableFilterMatchMode,
  value: unknown,
  filter: unknown,
  locale?: string,
): boolean {
  if (filter == null || (typeof filter === 'string' && !filter.trim())) return true;
  if (value == null) return mode === 'notContains' || mode === 'notEquals';
  const text = (v: unknown) => String(v).toLocaleLowerCase(locale);
  switch (mode) {
    case 'startsWith':
      return text(value).startsWith(text(filter));
    case 'contains':
      return text(value).includes(text(filter));
    case 'notContains':
      return !text(value).includes(text(filter));
    case 'endsWith':
      return text(value).endsWith(text(filter));
    case 'equals':
      return text(value) === text(filter);
    case 'notEquals':
      return text(value) !== text(filter);
    case 'in':
      return Array.isArray(filter) && filter.some((item) => deepEquals(item, value));
    case 'lt':
      return Number(value) < Number(filter);
    case 'lte':
      return Number(value) <= Number(filter);
    case 'gt':
      return Number(value) > Number(filter);
    case 'gte':
      return Number(value) >= Number(filter);
  }
}

function compareValues(value1: unknown, value2: unknown): number {
  if (value1 == null && value2 != null) return -1;
  if (value1 != null && value2 == null) return 1;
  if (value1 == null && value2 == null) return 0;
  if (typeof value1 === 'string' && typeof value2 === 'string')
    return value1.localeCompare(value2, undefined, { numeric: true });
  return (value1 as number) < (value2 as number) ? -1 : (value1 as number) > (value2 as number) ? 1 : 0;
}

interface FilterParams {
  field?: string;
  value: unknown;
  mode: IntTreetableFilterMatchMode;
  strict: boolean;
  globalFields?: readonly string[];
}

/**
 * <int-treetable> · version 1. Replica of PrimeNG v20 p-treetable without PrimeNG at runtime.
 * Hierarchical data in a table: the consumer writes the rows in the header / body templates with the
 * companion pieces of this file ([ttRow], int-treetable-toggler, [ttSortableColumn]…), as in PrimeNG.
 * Sorting, filtering, pagination (int-paginator), lazy loading and single / multiple / checkbox selection.
 */
@Component({
  selector: 'int-treetable',
  templateUrl: './treetable.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet, IntPaginator],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-treetable puts its root classes on the host element.
  host: { '[class]': 'classes()' },
})
export class IntTreetable implements OnChanges, OnInit {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  private readonly destroyRef = inject(DestroyRef);

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Nodos que se muestran: un arreglo de `TreeNode` con `data`, `children` y `expanded`. */
  readonly value = input<IntTreeNode[]>();
  /** Columnas dinámicas; llegan como contexto a los templates `header`, `body` y `footer`. */
  readonly columns = input<readonly IntTreetableColumn[]>();
  /** Estilo en línea de la tabla. */
  readonly tableStyle = input<Record<string, string> | null>();
  /** Clase de estilo de la tabla. */
  readonly tableStyleClass = input<string>();
  /** El ancho de las celdas se ajusta a su contenido. */
  readonly autoLayout = input(false, { transform: booleanAttribute });
  /** Los datos se cargan y procesan fuera del componente (`onLazyLoad`). */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Emite `onLazyLoad` al iniciar cuando `lazy` está activo. */
  readonly lazyLoadOnInit = input(true, { transform: booleanAttribute });
  /** Activa la paginación de los nodos raíz. */
  readonly paginator = input(false, { transform: booleanAttribute });
  /** Cantidad de nodos raíz por página. */
  readonly rows = input(0, { transform: numberAttribute });
  /** Índice del primer nodo raíz que se muestra. */
  readonly first = input(0, { transform: numberAttribute });
  /** Cantidad de enlaces de página del paginador. */
  readonly pageLinks = input(5, { transform: numberAttribute });
  /** Opciones del selector de filas por página del paginador. */
  readonly rowsPerPageOptions = input<readonly IntPaginatorRowsPerPageOption[]>();
  /** Muestra el paginador aunque haya una sola página. */
  readonly alwaysShowPaginator = input(true, { transform: booleanAttribute });
  /** Posición del paginador: `top`, `bottom` o `both`. */
  readonly paginatorPosition = input<'top' | 'bottom' | 'both'>('bottom');
  /** Clase de estilo del paginador. */
  readonly paginatorStyleClass = input<string>();
  /** Dónde se inserta la lista del selector del paginador: `self`, `body` o un elemento. */
  readonly paginatorDropdownAppendTo = input<IntPaginatorAppendTo>('self');
  /** Texto del reporte de página: `{currentPage}`, `{totalPages}`, `{rows}`, `{first}`, `{last}` y `{totalRecords}`. */
  readonly currentPageReportTemplate = input('{currentPage} of {totalPages}');
  /** Muestra el reporte de página actual. */
  readonly showCurrentPageReport = input(false, { transform: booleanAttribute });
  /** Muestra un selector para saltar a cualquier página. */
  readonly showJumpToPageDropdown = input(false, { transform: booleanAttribute });
  /** Muestra los botones de primera y última página. */
  readonly showFirstLastIcon = input(true, { transform: booleanAttribute });
  /** Muestra los enlaces de página. */
  readonly showPageLinks = input(true, { transform: booleanAttribute });
  /** Locale con el que el paginador formatea los números. */
  readonly paginatorLocale = input<string>();
  /** Orden que toma una columna sin ordenar al hacer clic: `1` ascendente, `-1` descendente. */
  readonly defaultSortOrder = input(1, { transform: numberAttribute });
  /** Orden por una columna (`single`) o por varias con Ctrl / ⌘ (`multiple`). */
  readonly sortMode = input<'single' | 'multiple'>('single');
  /** Vuelve el scroll al inicio después de ordenar. */
  readonly resetPageOnSort = input(true, { transform: booleanAttribute });
  /** El orden lo hace el consumidor en `sortFunction`, ordenando `event.data` en el lugar. */
  readonly customSort = input(false, { transform: booleanAttribute });
  /** Modo de selección: `single`, `multiple` o `checkbox`. */
  readonly selectionMode = input<IntTreetableSelectionMode>();
  /** Campo que identifica cada registro (en el nodo o en `data`); clave de `selectionKeys`. */
  readonly dataKey = input<string>();
  /** Con `true`, en `multiple` hace falta Ctrl / ⌘ para sumar filas y para quitar una fila seleccionada. */
  readonly metaKeySelection = input(false, { transform: booleanAttribute });
  /** Cómo se compara la selección: `equals` (referencia) o `deepEquals` (por `dataKey` o por todos los campos). */
  readonly compareSelectionBy = input<'equals' | 'deepEquals'>('deepEquals');
  /** Resalta la fila bajo el puntero aunque no haya `selectionMode`. */
  readonly rowHover = input(false, { transform: booleanAttribute });
  /** Muestra la máscara de carga. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Clase del icono de carga (por defecto `icon icon-loading`). */
  readonly loadingIcon = input<string>();
  /** Muestra la máscara cuando `loading` es `true`. */
  readonly showLoader = input(true, { transform: booleanAttribute });
  /** El cuerpo se desplaza dentro de `scrollHeight` con la cabecera fija. */
  readonly scrollable = input(false, { transform: booleanAttribute });
  /** Alto del área con scroll (`400px`) o `flex` para ocupar el alto del contenedor. */
  readonly scrollHeight = input<string>();
  /** Función de seguimiento de filas del `@for` del cuerpo. */
  readonly rowTrackBy = input<IntTreetableTrackBy>((_index, row) => row.node);
  /** Filtros iniciales por campo (`{ name: { value: 'a', matchMode: 'contains' } }`). */
  readonly filters = input<IntTreetableFilters>({});
  /** Campos en los que busca `filterGlobal()`; sin ellos usa los `field` de `columns`. */
  readonly globalFilterFields = input<readonly string[]>();
  /** Milisegundos de espera antes de filtrar. */
  readonly filterDelay = input(300, { transform: numberAttribute });
  /** `lenient` conserva el padre que coincide con todos sus hijos; `strict` solo las ramas con hojas que coinciden. */
  readonly filterMode = input<'lenient' | 'strict'>('lenient');
  /** Locale para comparar textos al filtrar. */
  readonly filterLocale = input<string>();
  /** Total de nodos raíz; por defecto la cantidad de `value`. Necesario con `lazy`. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** Campo por el que se ordena al iniciar. */
  readonly sortField = input<string | null>();
  /** Orden inicial de `sortField`: `1` ascendente, `-1` descendente. */
  readonly sortOrder = input(1, { transform: numberAttribute });
  /** Orden inicial en `sortMode="multiple"`. */
  readonly multiSortMeta = input<IntTreetableSortMeta[] | null>();
  /** Nodo seleccionado (`single`) o arreglo de nodos (`multiple`); admite `[(selection)]`. */
  readonly selection = model<IntTreeNode | IntTreeNode[] | null>(null);
  /** Estado de los checkbox por clave (`{ key: { checked, partialChecked } }`); admite `[(selectionKeys)]`. */
  readonly selectionKeys = model<IntTreetableSelectionKeys>();
  /**
   * int-* extension: clases de icono del orden por estado, sin escribir el template `sorticon`
   * (`{ unsorted: 'icon icon-sort-table', ascending: 'icon icon-nav-up', descending: 'icon icon-nav-down' }`).
   * Los estados que no se indican usan las flechas por defecto.
   */
  readonly sortIcons = input<IntTreetableSortIcons>({});
  /** Muestra bordes en todas las celdas. */
  readonly showGridlines = input(false, { transform: booleanAttribute });
  /** int-* extension: la cabecera queda fija bajo el header del dashboard al desplazar la página. Ningún contenedor de la tabla debe tener `overflow`. */
  readonly stickyHeader = input(false, { transform: booleanAttribute });

  /** Se emite al filtrar, con los filtros y los nodos que quedan. */
  readonly onFilter = output<IntTreetableFilterEvent>();
  /** Se emite al expandir un nodo. */
  readonly onNodeExpand = output<IntTreetableNodeEvent>();
  /** Se emite al contraer un nodo. */
  readonly onNodeCollapse = output<IntTreetableNodeEvent>();
  /** Se emite al cambiar de página, con `first` y `rows`. */
  readonly onPage = output<IntTreetablePageEvent>();
  /** Se emite al ordenar: `{ field, order }` o `{ multisortmeta }`. */
  readonly onSort = output<IntTreetableSortMeta | { multisortmeta: IntTreetableSortMeta[] | null }>();
  /** Se emite con `lazy` al paginar, ordenar o filtrar, con el estado que debe cargar el consumidor. */
  readonly onLazyLoad = output<IntTreetableLazyLoadEvent>();
  /** Se emite con `customSort` por cada arreglo de nodos que hay que ordenar (`event.data`, en el lugar). */
  readonly sortFunction = output<IntTreetableSortEvent>();
  /** Se emite al seleccionar una fila. */
  readonly onNodeSelect = output<IntTreetableNodeEvent>();
  /** Se emite al quitar la selección de una fila. */
  readonly onNodeUnselect = output<IntTreetableNodeEvent>();
  /** Se emite al marcar o desmarcar el checkbox de la cabecera. */
  readonly onHeaderCheckboxToggle = output<IntTreetableHeaderCheckboxToggleEvent>();

  // Templates by reference, same names as PrimeNG. Public: the companion pieces read them.
  /** Contenido sobre la tabla (búsqueda, acciones). */
  readonly captionTemplate = contentChild<TemplateRef<void>>('caption');
  /** Filas del `thead`; recibe `columns` como `$implicit`. */
  readonly headerTemplate = contentChild<TemplateRef<IntTreetableTemplateContext>>('header');
  /** Fila de cada nodo visible; recibe el nodo serializado (`$implicit`), `node`, `rowData` y `columns`. */
  readonly bodyTemplate = contentChild<TemplateRef<IntTreetableBodyContext>>('body');
  /** Filas del `tfoot`; recibe `columns`. */
  readonly footerTemplate = contentChild<TemplateRef<IntTreetableTemplateContext>>('footer');
  /** Contenido debajo de la tabla. */
  readonly summaryTemplate = contentChild<TemplateRef<void>>('summary');
  /** `colgroup` de la tabla; recibe `columns`. */
  readonly colGroupTemplate = contentChild<TemplateRef<IntTreetableTemplateContext>>('colgroup');
  /** Fila que se muestra cuando no hay nodos; recibe `columns`. */
  readonly emptyMessageTemplate = contentChild<TemplateRef<IntTreetableTemplateContext>>('emptymessage');
  /** Reemplaza el icono de carga. */
  readonly loadingIconTemplate = contentChild<TemplateRef<void>>('loadingicon');
  /** Reemplaza el icono del toggler; recibe `expanded` como `$implicit`. */
  readonly togglerIconTemplate = contentChild<TemplateRef<IntTreetableIconContext>>('togglericon');
  /** Reemplaza el icono de orden; recibe el orden (`0`, `1`, `-1`) como `$implicit`. */
  readonly sortIconTemplate = contentChild<TemplateRef<IntTreetableIconContext>>('sorticon');
  /** Reemplaza el icono del checkbox de fila; recibe `checked` y `partialSelected`. */
  readonly checkboxIconTemplate = contentChild<TemplateRef<IntTreetableIconContext>>('checkboxicon');
  /** Reemplaza el icono del checkbox de la cabecera; recibe `checked`. */
  readonly headerCheckboxIconTemplate = contentChild<TemplateRef<IntTreetableIconContext>>('headercheckboxicon');
  /** Contenido a la izquierda del paginador. */
  readonly paginatorLeftTemplate = contentChild<TemplateRef<IntPaginatorTemplateContext>>('paginatorleft');
  /** Contenido a la derecha del paginador. */
  readonly paginatorRightTemplate = contentChild<TemplateRef<IntPaginatorTemplateContext>>('paginatorright');

  private readonly wrapper = viewChild<ElementRef<HTMLElement>>('wrapper');

  // State. Sort, page and filters start from the inputs and then change with the interaction.
  readonly currentSortField = linkedSignal(() => this.sortField() ?? null);
  readonly currentSortOrder = linkedSignal(() => this.sortOrder());
  readonly currentMultiSortMeta = linkedSignal(() => this.multiSortMeta() ?? null);
  protected readonly currentFirst = linkedSignal(() => this.first());
  protected readonly currentRows = linkedSignal(() => this.rows());
  protected readonly currentTotalRecords = linkedSignal(() => this.totalRecords());
  private currentFilters: IntTreetableFilters = {};
  /** Copy of the matching branches while a filter is active (PrimeNG's filteredNodes). */
  private readonly filteredNodes = signal<IntTreeNode[] | null>(null);
  /**
   * Bumped when nodes change in place (expanded, sorted, parent links): the rows and the companion
   * pieces read it, since the nodes are plain objects owned by the consumer, as in PrimeNG.
   */
  readonly version = signal(0);
  /** Row that holds the single tab stop of the body (roving tabindex). */
  readonly activeNode = signal<IntTreeNode | null>(null);
  private rowTouched = false;
  private filterTimeout: ReturnType<typeof setTimeout> | undefined;
  private initialized = false;
  /** Stable row objects per node, so @for keeps the DOM rows (and the toggler rotation) on re-render. */
  private readonly rowCache = new WeakMap<IntTreeNode, IntTreetableNode>();

  /** Nodes the table works on: the filtered copy or the value. */
  readonly data = computed(() => this.filteredNodes() ?? this.value() ?? []);

  /** Visible rows of the body, in order (PrimeNG's serializedValue without the hidden ones). */
  readonly rowsToRender = computed(() => {
    this.version();
    const rows: IntTreetableNode[] = [];
    const serialize = (parent: IntTreeNode | null, nodes: IntTreeNode[] | undefined, level: number) => {
      for (const node of nodes ?? []) {
        node.parent = parent;
        rows.push(this.row(node, parent, level));
        if (node.expanded) serialize(node, node.children, level + 1);
      }
    };
    const data = this.data();
    if (this.paginator()) {
      const first = this.lazy() ? 0 : this.currentFirst();
      for (const node of data.slice(first, first + this.currentRows())) {
        node.parent = null;
        rows.push(this.row(node, null, 0));
        if (node.expanded) serialize(node, node.children, 1);
      }
    } else serialize(null, data, 0);
    return rows;
  });

  protected readonly isEmpty = computed(() => this.data().length === 0);

  protected readonly trackRow = (index: number, row: IntTreetableNode) => this.rowTrackBy()(index, row);

  /** Node whose row is the tab stop: the active one while visible, else the first row. */
  readonly tabStopNode = computed(() => {
    const rows = this.rowsToRender();
    const active = this.activeNode();
    return rows.some((row) => row.node === active) ? active : (rows[0]?.node ?? null);
  });

  protected readonly classes = computed(() => {
    const mode = this.selectionMode();
    return [
      'int-treetable',
      this.showGridlines() && 'int-treetable--gridlines',
      (this.rowHover() || mode === 'single' || mode === 'multiple') && 'int-treetable--hoverable-rows',
      this.autoLayout() && 'int-treetable--auto-layout',
      this.scrollable() && 'int-treetable--scrollable',
      this.scrollable() && this.scrollHeight() === 'flex' && 'int-treetable--flex-scrollable',
      this.stickyHeader() && 'int-treetable--sticky-header',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly wrapperMaxHeight = computed(() =>
    this.scrollable() && this.scrollHeight() !== 'flex' ? (this.scrollHeight() ?? null) : null,
  );

  protected readonly showTopPaginator = computed(
    () => this.paginator() && this.paginatorPosition() !== 'bottom',
  );
  protected readonly showBottomPaginator = computed(
    () => this.paginator() && this.paginatorPosition() !== 'top',
  );

  /** Header checkbox: every root node checked. */
  readonly allChecked = computed(() => {
    const data = this.data();
    return data.length > 0 && data.every((node) => this.isNodeSelected(node));
  });

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.filterTimeout));
  }

  ngOnInit(): void {
    if (this.lazy() && this.lazyLoadOnInit()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    this.initialized = true;
  }

  // Same reactions as PrimeNG's onChanges: a new value or a new sort re-sorts / re-filters the nodes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) this.currentFilters = { ...this.filters() };
    if (changes['value']) {
      if (!this.lazy()) {
        this.currentTotalRecords.set(this.value()?.length ?? 0);
        if (this.sortMode() === 'single' && this.currentSortField()) this.sortSingle();
        else if (this.sortMode() === 'multiple' && this.currentMultiSortMeta()) this.sortMultiple();
        else if (this.hasFilter()) this.applyFilter();
      }
      this.bump();
    }
    // Avoids a lazy load before ngOnInit, as PrimeNG.
    if ((changes['sortField'] || changes['sortOrder']) && !changes['value'] && this.sortMode() === 'single' && (!this.lazy() || this.initialized))
      this.sortSingle();
    if (changes['multiSortMeta'] && !changes['value'] && this.sortMode() === 'multiple') this.sortMultiple();
  }

  /**
   * Filtra por un campo con el `matchMode` indicado (por defecto `startsWith`), después de `filterDelay`.
   * Un valor vacío quita el filtro de ese campo.
   */
  filter(value: unknown, field: string, matchMode: IntTreetableFilterMatchMode = 'startsWith'): void {
    clearTimeout(this.filterTimeout);
    const blank = value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
    if (!blank) this.currentFilters[field] = { value, matchMode };
    else delete this.currentFilters[field];
    this.filterTimeout = setTimeout(() => this.applyFilter(), this.filterDelay());
  }

  /** Filtra en todos los campos de `globalFilterFields` (o de `columns`). */
  filterGlobal(value: unknown, matchMode: IntTreetableFilterMatchMode = 'contains'): void {
    this.filter(value, 'global', matchMode);
  }

  /** Quita el orden, los filtros y vuelve a la primera página. */
  reset(): void {
    this.currentSortField.set(null);
    this.currentSortOrder.set(1);
    this.currentMultiSortMeta.set(null);
    this.filteredNodes.set(null);
    this.currentFilters = {};
    this.currentFirst.set(0);
    if (this.lazy()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    else this.currentTotalRecords.set(this.value()?.length ?? 0);
  }

  /** Vuelve el scroll del cuerpo al inicio. */
  resetScrollTop(): void {
    this.scrollTo({ top: 0 });
  }

  /** Desplaza el cuerpo con `scrollable` a la posición indicada. */
  scrollTo(options: ScrollToOptions): void {
    this.wrapper()?.nativeElement.scrollTo?.(options);
  }

  // --- Internal API of the companion pieces (arrow properties: not part of the API tab) ---

  readonly isSorted = (field: string): boolean =>
    this.sortMode() === 'single'
      ? !!field && this.currentSortField() === field
      : !!this.currentMultiSortMeta()?.some((meta) => meta.field === field);

  readonly getSortMeta = (field: string): IntTreetableSortMeta | null =>
    this.currentMultiSortMeta()?.find((meta) => meta.field === field) ?? null;

  /** Header click on a [ttSortableColumn]: same rules as PrimeNG's sort(). */
  readonly sort = (originalEvent: MouseEvent | KeyboardEvent, field: string): void => {
    if (this.sortMode() === 'single') {
      this.currentSortOrder.set(this.currentSortField() === field ? this.currentSortOrder() * -1 : this.defaultSortOrder());
      this.currentSortField.set(field);
      this.sortSingle();
    } else {
      const metaKey = originalEvent.metaKey || originalEvent.ctrlKey;
      const current = this.currentMultiSortMeta();
      const meta = this.getSortMeta(field);
      if (meta)
        this.currentMultiSortMeta.set(
          metaKey
            ? (current ?? []).map((m) => (m.field === field ? { ...m, order: m.order * -1 } : m))
            : [{ field, order: meta.order * -1 }],
        );
      else
        this.currentMultiSortMeta.set([
          ...(!metaKey || !current ? [] : current),
          { field, order: this.defaultSortOrder() },
        ]);
      this.sortMultiple();
    }
    if (this.resetPageOnSort() && this.scrollable()) this.resetScrollTop();
  };

  readonly onPageChange = (event: IntPaginatorPageChangeEvent): void => {
    this.currentFirst.set(event.first);
    this.currentRows.set(event.rows);
    if (this.lazy()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    this.onPage.emit({ first: event.first, rows: event.rows });
    if (this.scrollable()) this.resetScrollTop();
  };

  /** Toggler click and keyboard: flips node.expanded and emits like PrimeNG. */
  readonly toggleNode = (event: Event, node: IntTreeNode, expanded = !node.expanded): void => {
    node.expanded = expanded;
    if (expanded) this.onNodeExpand.emit({ originalEvent: event, node });
    else this.onNodeCollapse.emit({ originalEvent: event, node });
    this.bump();
  };

  readonly isSelected = (node: IntTreeNode): boolean => {
    const selection = this.selection();
    if (!node || !selection) return false;
    return Array.isArray(selection) ? this.indexInSelection(node) > -1 : this.equals(node, selection);
  };

  readonly nodeKey = (node: IntTreeNode): string => {
    const dataKey = this.dataKey();
    // Without dataKey PrimeNG would read undefined: TreeNode.key is the natural key of a tree node.
    if (!dataKey) return String(node.key);
    return String(resolveFieldData(node, dataKey) ?? resolveFieldData(node.data, dataKey));
  };

  readonly isNodeSelected = (node: IntTreeNode): boolean =>
    !!this.selectionMode() && this.selectionKeys()?.[this.nodeKey(node)]?.checked === true;

  readonly isNodePartialSelected = (node: IntTreeNode): boolean =>
    !!this.selectionMode() && this.selectionKeys()?.[this.nodeKey(node)]?.partialChecked === true;

  readonly handleRowTouchEnd = (): void => {
    this.rowTouched = true;
  };

  /** Row click on a [ttSelectableRow]: same branches as PrimeNG's handleRowClick. */
  readonly handleRowClick = (event: Event, node: IntTreeNode): void => {
    // Inner controls keep their own click (PrimeNG checks INPUT, BUTTON and A on the target).
    if ((event.target as HTMLElement | null)?.closest('input, button, a')) return;
    const mode = this.selectionMode();
    if (mode !== 'single' && mode !== 'multiple') return;
    const selected = this.isSelected(node);
    const metaSelection = this.rowTouched ? false : this.metaKeySelection();
    const metaKey = event instanceof MouseEvent || event instanceof KeyboardEvent ? event.metaKey || event.ctrlKey : false;
    const current = this.selection();
    const list = Array.isArray(current) ? current : [];
    const unselect = () => {
      const index = this.indexInSelection(node);
      this.selection.set(mode === 'single' ? null : list.filter((_, i) => i !== index));
      this.onNodeUnselect.emit({ originalEvent: event, node, type: 'row' });
    };
    const select = (keep: boolean) => {
      this.selection.set(mode === 'single' ? node : [...(keep ? list : []), node]);
      this.onNodeSelect.emit({ originalEvent: event, node, type: 'row' });
    };
    if (metaSelection) {
      if (selected && metaKey) unselect();
      else select(metaKey);
    } else if (selected) unselect();
    else select(true);
    this.rowTouched = false;
  };

  /** Row checkbox: propagates the check down to the children and up to the parents in selectionKeys. */
  readonly toggleCheckbox = (node: IntTreeNode, check: boolean): void => {
    const keys = { ...(this.selectionKeys() ?? {}) };
    this.propagateDown(keys, node, check);
    if (node.parent) this.propagateUp(keys, node.parent, check);
    this.selectionKeys.set(keys);
  };

  readonly toggleAll = (originalEvent: Event, check: boolean): void => {
    const data = this.data();
    if (!data.length) return;
    const keys = { ...(this.selectionKeys() ?? {}) };
    for (const node of data) this.propagateDown(keys, node, check);
    this.selectionKeys.set(keys);
    this.selection.set(check ? data.slice() : []);
    this.onHeaderCheckboxToggle.emit({ originalEvent, checked: check });
  };

  // --- Sorting, filtering and selection helpers (PrimeNG's TreeTable methods) ---

  private bump(): void {
    this.version.update((v) => v + 1);
  }

  private row(node: IntTreeNode, parent: IntTreeNode | null, level: number): IntTreetableNode {
    const cached = this.rowCache.get(node);
    if (cached) {
      cached.parent = parent;
      cached.level = level;
      return cached;
    }
    const row = { node, parent, level, visible: true };
    this.rowCache.set(node, row);
    return row;
  }

  private sortSingle(): void {
    const field = this.currentSortField();
    const order = this.currentSortOrder();
    if (!field || !order) return;
    if (this.lazy()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    else if (this.value()) {
      this.sortNodes(this.value());
      if (this.hasFilter()) this.applyFilter();
    }
    this.onSort.emit({ field, order });
    this.bump();
  }

  // Sorts in place, like PrimeNG: the nodes are the consumer's objects and keep their identity.
  private sortNodes(nodes: IntTreeNode[] | undefined): void {
    if (!nodes?.length) return;
    const field = this.currentSortField();
    const order = this.currentSortOrder();
    if (this.customSort())
      this.sortFunction.emit({ data: nodes, mode: this.sortMode(), field, order });
    else
      nodes.sort((a, b) => order * compareValues(resolveFieldData(a.data, field), resolveFieldData(b.data, field)));
    for (const node of nodes) this.sortNodes(node.children);
  }

  private sortMultiple(): void {
    const meta = this.currentMultiSortMeta();
    if (!meta) return;
    if (this.lazy()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    else if (this.value()) {
      this.sortMultipleNodes(this.value(), meta);
      if (this.hasFilter()) this.applyFilter();
    }
    this.onSort.emit({ multisortmeta: meta });
    this.bump();
  }

  private sortMultipleNodes(nodes: IntTreeNode[] | undefined, meta: IntTreetableSortMeta[]): void {
    if (!nodes?.length) return;
    if (this.customSort())
      this.sortFunction.emit({ data: this.value(), mode: this.sortMode(), multiSortMeta: meta });
    else
      nodes.sort((a, b) => {
        for (const { field, order } of meta) {
          const result = compareValues(resolveFieldData(a.data, field), resolveFieldData(b.data, field));
          if (result) return order * result;
        }
        return 0;
      });
    for (const node of nodes) this.sortMultipleNodes(node.children, meta);
  }

  private lazyLoadMetadata(): IntTreetableLazyLoadEvent {
    return {
      first: this.currentFirst(),
      rows: this.currentRows(),
      sortField: this.currentSortField(),
      sortOrder: this.currentSortOrder(),
      filters: this.currentFilters,
      globalFilter: this.currentFilters['global']?.value ?? null,
      multiSortMeta: this.currentMultiSortMeta(),
      forceUpdate: () => this.bump(),
    };
  }

  private hasFilter(): boolean {
    return Object.keys(this.currentFilters).length > 0;
  }

  // PrimeNG's _filter: copies of the root nodes, with their children narrowed to the matching ones.
  private applyFilter(): void {
    if (this.lazy()) this.onLazyLoad.emit(this.lazyLoadMetadata());
    else {
      const value = this.value();
      if (!value) return;
      if (!this.hasFilter()) {
        this.filteredNodes.set(null);
        if (this.paginator()) this.currentTotalRecords.set(value.length);
      } else {
        const global = this.currentFilters['global'];
        const globalFields =
          this.globalFilterFields() ??
          this.columns()?.map((column) => column.field).filter((field): field is string => !!field);
        const strict = this.filterMode() === 'strict';
        const filtered: IntTreeNode[] = [];
        for (const node of value) {
          let copy: IntTreeNode = { ...node };
          let localMatch = true;
          for (const [field, meta] of Object.entries(this.currentFilters)) {
            if (field === 'global') continue;
            const params: FilterParams = { field, value: meta.value, mode: meta.matchMode ?? 'startsWith', strict };
            const found = strict
              ? this.findFilteredNodes(copy, params) || this.isFilterMatched(copy, params)
              : this.isFilterMatched(copy, params) || this.findFilteredNodes(copy, params);
            if (!found) {
              localMatch = false;
              break;
            }
          }
          let globalMatch = false;
          if (global && globalFields?.length) {
            const globalCopy = { ...copy };
            const params: FilterParams = { value: global.value, mode: global.matchMode ?? 'contains', strict, globalFields };
            if (strict
              ? this.findFilteredNodes(globalCopy, params) || this.isFilterMatched(globalCopy, params)
              : this.isFilterMatched(globalCopy, params) || this.findFilteredNodes(globalCopy, params)) {
              globalMatch = true;
              copy = globalCopy;
            }
          }
          if (global ? localMatch && globalMatch : localMatch) filtered.push(copy);
        }
        this.filteredNodes.set(filtered);
        if (this.paginator()) this.currentTotalRecords.set(filtered.length);
      }
    }
    this.currentFirst.set(0);
    const filteredValue = this.filteredNodes() ?? this.value();
    this.onFilter.emit({ filters: this.currentFilters, filteredValue });
    this.bump();
    if (this.scrollable()) this.resetScrollTop();
  }

  private findFilteredNodes(node: IntTreeNode, params: FilterParams): boolean {
    if (!node.children) return false;
    const children = [...node.children];
    node.children = [];
    let matched = false;
    for (const child of children) {
      const copy = { ...child };
      if (this.isFilterMatched(copy, params)) {
        matched = true;
        node.children.push(copy);
      }
    }
    return matched;
  }

  private isFilterMatched(node: IntTreeNode, params: FilterParams): boolean {
    const locale = this.filterLocale();
    const test = (field?: string) => matches(params.mode, resolveFieldData(node.data, field), params.value, locale);
    let matched = params.globalFields?.length ? params.globalFields.some(test) : test(params.field);
    const leaf = node.leaf === false ? false : !node.children?.length;
    if (!matched || (params.strict && !leaf)) matched = this.findFilteredNodes(node, params) || matched;
    return matched;
  }

  private indexInSelection(node: IntTreeNode): number {
    const selection = this.selection();
    return Array.isArray(selection) ? selection.findIndex((item) => this.equals(node, item)) : -1;
  }

  private equals(a: IntTreeNode, b: IntTreeNode): boolean {
    if (this.compareSelectionBy() === 'equals') return a === b;
    const dataKey = this.dataKey();
    return dataKey
      ? resolveFieldData(a.data, dataKey) === resolveFieldData(b.data, dataKey)
      : a === b || deepEquals(a.data, b.data);
  }

  private propagateDown(keys: IntTreetableSelectionKeys, node: IntTreeNode, check: boolean): void {
    if (check) keys[this.nodeKey(node)] = { checked: true, partialChecked: false };
    else delete keys[this.nodeKey(node)];
    for (const child of node.children ?? []) this.propagateDown(keys, child, check);
  }

  private propagateUp(keys: IntTreetableSelectionKeys, node: IntTreeNode, check: boolean): void {
    const children = node.children ?? [];
    const checkedCount = children.filter((child) => keys[this.nodeKey(child)]?.checked).length;
    const childPartial = children.some((child) => keys[this.nodeKey(child)]?.partialChecked);
    const key = this.nodeKey(node);
    if (check && checkedCount === children.length) keys[key] = { checked: true, partialChecked: false };
    else
      keys[key] = {
        checked: false,
        partialChecked: childPartial || (checkedCount > 0 && checkedCount !== children.length),
      };
    if (node.parent) this.propagateUp(keys, node.parent, check);
  }
}

/**
 * [ttRow]: row of a node. role="row" with aria-level / aria-expanded and the keyboard of PrimeNG's TTRow,
 * with a single tab stop for the whole body (roving tabindex).
 */
@Directive({
  selector: '[ttRow]',
  host: {
    class: 'int-treetable__row',
    role: 'row',
    '[class]': 'styleClass()',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-level]': 'rowNode().level + 1',
    '(keydown)': 'onKeyDown($event)',
    '(focusin)': 'tt.activeNode.set(rowNode().node)',
  },
})
export class IntTreetableRow {
  protected readonly tt = inject(IntTreetable);
  private readonly el = inject<ElementRef<HTMLTableRowElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Nodo serializado de la fila (el `$implicit` del template `body`). */
  readonly rowNode = input.required<IntTreetableNode>({ alias: 'ttRow' });

  protected readonly expanded = computed(() => {
    this.tt.version();
    return this.rowNode().node.expanded ?? null;
  });
  protected readonly styleClass = computed(() => this.rowNode().node.styleClass ?? '');
  protected readonly tabIndex = computed(() => (this.tt.tabStopNode() === this.rowNode().node ? 0 : -1));

  protected onKeyDown(event: KeyboardEvent): void {
    // Keys of the row only: a control inside a cell keeps its own arrows and Home / End.
    if (event.target !== this.el.nativeElement) return;
    const row = this.el.nativeElement;
    const { node, level } = this.rowNode();
    switch (event.code) {
      case 'ArrowDown':
        (row.nextElementSibling as HTMLElement | null)?.focus();
        break;
      case 'ArrowUp':
        (row.previousElementSibling as HTMLElement | null)?.focus();
        break;
      case 'ArrowRight':
        if (!node.expanded && (node.children?.length || node.leaf === false)) {
          this.tt.toggleNode(event, node, true);
          // Same as PrimeNG: the focus moves to the first child once it is rendered.
          afterNextRender(() => (row.nextElementSibling as HTMLElement | null)?.focus(), { injector: this.injector });
        }
        break;
      case 'ArrowLeft':
        if (node.expanded) this.tt.toggleNode(event, node, false);
        else if (level > 0) this.focusLevel(level - 1, 'previous');
        break;
      case 'Home':
        this.levelRows(level)[0]?.focus();
        break;
      case 'End':
        this.levelRows(level).at(-1)?.focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private levelRows(level: number): HTMLElement[] {
    return [...(this.el.nativeElement.parentElement?.querySelectorAll<HTMLElement>(`:scope > tr[aria-level="${level + 1}"]`) ?? [])];
  }

  /** Parent row: the closest previous row one level up. */
  private focusLevel(level: number, direction: 'previous'): void {
    let sibling = this.el.nativeElement[`${direction}ElementSibling`] as HTMLElement | null;
    while (sibling && sibling.getAttribute('aria-level') !== String(level + 1))
      sibling = sibling[`${direction}ElementSibling`] as HTMLElement | null;
    sibling?.focus();
  }
}

/** <int-treetable-toggler>: expands / collapses the node and indents the cell by its level. */
@Component({
  selector: 'int-treetable-toggler',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="int-treetable__toggler"
      [class.int-treetable__toggler--expanded]="expanded()"
      tabindex="-1"
      [style.visibility]="expandable() ? 'visible' : 'hidden'"
      [style.margin-inline-start]="indent()"
      [attr.aria-label]="expanded() ? 'Collapse Row' : 'Expand Row'"
      (click)="onClick($event)"
    >
      @if (tt.togglerIconTemplate(); as template) {
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: expanded() }" />
      } @else {
        <i class="int-treetable__toggler-icon icon icon-arrow-right" aria-hidden="true"></i>
      }
    </button>
  `,
})
export class IntTreetableToggler {
  protected readonly tt = inject(IntTreetable);

  /** Nodo serializado de la fila. */
  readonly rowNode = input.required<IntTreetableNode>();

  protected readonly expanded = computed(() => {
    this.tt.version();
    return !!this.rowNode().node.expanded;
  });
  protected readonly expandable = computed(() => {
    const { node } = this.rowNode();
    return node.leaf === false || !!node.children?.length;
  });
  // PrimeNG indents 16px per level; here the step is the --int-treetable-indent token.
  protected readonly indent = computed(() => `calc(${this.rowNode().level} * var(--int-treetable-indent))`);

  protected onClick(event: MouseEvent): void {
    this.tt.toggleNode(event, this.rowNode().node);
    event.preventDefault();
  }
}

/** [ttSortableColumn]: header cell that sorts by its field on click or Enter. */
@Directive({
  selector: '[ttSortableColumn]',
  host: {
    role: 'columnheader',
    '[class.int-treetable__sortable-column]': 'enabled()',
    '[class.int-treetable__sortable-column--sorted]': 'sorted()',
    '[attr.tabindex]': 'enabled() ? 0 : null',
    '[attr.aria-sort]': 'ariaSort()',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onClick($event)',
  },
})
export class IntTreetableSortableColumn {
  private readonly tt = inject(IntTreetable);

  /** Campo por el que ordena la columna. */
  readonly field = input.required<string>({ alias: 'ttSortableColumn' });
  /** Desactiva el orden de la columna. */
  readonly ttSortableColumnDisabled = input(false, { transform: booleanAttribute });

  protected readonly enabled = computed(() => !this.ttSortableColumnDisabled());
  protected readonly sorted = computed(() => this.enabled() && this.tt.isSorted(this.field()));
  protected readonly ariaSort = computed(() => {
    if (!this.sorted()) return 'none';
    const order = this.tt.sortMode() === 'single' ? this.tt.currentSortOrder() : (this.tt.getSortMeta(this.field())?.order ?? 0);
    return order < 0 ? 'descending' : 'ascending';
  });

  protected onClick(event: Event): void {
    if (!this.enabled()) return;
    this.tt.sort(event as MouseEvent | KeyboardEvent, this.field());
    document.getSelection()?.removeAllRanges();
  }
}

/** <int-treetable-sort-icon>: sort state of a column (arrows of the Style Guide) and its position in multiple sort. */
@Component({
  selector: 'int-treetable-sort-icon',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-treetable__sort-icon' },
  template: `
    @if (tt.sortIconTemplate(); as template) {
      <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: sortOrder() }" />
    } @else {
      <i class="int-treetable__sort-arrow" [class]="iconClass()" aria-hidden="true"></i>
    }
    @if (badge(); as position) {
      <!-- dep:badge provisional · replace with <int-badge> when badge is done -->
      <span class="int-treetable__sort-badge" data-dep="badge">{{ position }}</span>
      <!-- /dep:badge -->
    }
  `,
})
export class IntTreetableSortIcon {
  protected readonly tt = inject(IntTreetable);

  /** Campo de la columna. */
  readonly field = input.required<string>();

  protected readonly sortOrder = computed(() => {
    const field = this.field();
    if (this.tt.sortMode() === 'single') return this.tt.isSorted(field) ? this.tt.currentSortOrder() : 0;
    return this.tt.getSortMeta(field)?.order ?? 0;
  });
  /** Style Guide arrows as the knowledge base (down while unsorted), unless sortIcons overrides a state. */
  protected readonly iconClass = computed(() => {
    const icons = this.tt.sortIcons();
    const order = this.sortOrder();
    if (order === 1) return icons.ascending ?? 'icon icon-nav-up';
    if (order === -1) return icons.descending ?? 'icon icon-nav-down';
    return icons.unsorted ?? 'icon icon-nav-down';
  });
  /** Position in multiple sort, shown when more than one column sorts (PrimeNG's p-badge). */
  protected readonly badge = computed(() => {
    const meta = this.tt.currentMultiSortMeta();
    if (this.tt.sortMode() !== 'multiple' || !meta || meta.length < 2) return 0;
    return meta.findIndex((m) => m.field === this.field()) + 1;
  });
}

/** [ttSelectableRow]: row selected with click, Enter or Space according to selectionMode. */
@Directive({
  selector: '[ttSelectableRow]',
  host: {
    '[class.int-treetable__row--selected]': 'selected()',
    '[attr.aria-selected]': 'enabled() ? selected() : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
    '(touchend)': 'enabled() && tt.handleRowTouchEnd()',
  },
})
export class IntTreetableSelectableRow {
  protected readonly tt = inject(IntTreetable);

  /** Nodo serializado de la fila. */
  readonly rowNode = input.required<IntTreetableNode>({ alias: 'ttSelectableRow' });
  /** Desactiva la selección de la fila. */
  readonly ttSelectableRowDisabled = input(false, { transform: booleanAttribute });

  protected readonly enabled = computed(() => !this.ttSelectableRowDisabled());
  protected readonly selected = computed(() => {
    const node = this.rowNode().node;
    return this.enabled() && (this.tt.selectionMode() === 'checkbox' ? this.tt.isNodeSelected(node) : this.tt.isSelected(node));
  });

  protected onClick(event: Event): void {
    if (this.enabled()) this.tt.handleRowClick(event, this.rowNode().node);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if ((event.code !== 'Enter' && event.code !== 'Space') || event.target !== event.currentTarget) return;
    const node = this.rowNode().node;
    if (this.tt.selectionMode() === 'checkbox') {
      if (this.enabled()) this.tt.toggleCheckbox(node, !this.tt.isNodeSelected(node));
    } else this.onClick(event);
    event.preventDefault();
  }
}

/** [ttSelectableRowDblClick]: same as [ttSelectableRow] but selects on double click. */
@Directive({
  selector: '[ttSelectableRowDblClick]',
  host: {
    '[class.int-treetable__row--selected]': 'selected()',
    '(dblclick)': 'onDblClick($event)',
  },
})
export class IntTreetableSelectableRowDblClick {
  private readonly tt = inject(IntTreetable);

  /** Nodo serializado de la fila. */
  readonly rowNode = input.required<IntTreetableNode>({ alias: 'ttSelectableRowDblClick' });
  /** Desactiva la selección de la fila. */
  readonly ttSelectableRowDisabled = input(false, { transform: booleanAttribute });

  protected readonly selected = computed(() => !this.ttSelectableRowDisabled() && this.tt.isSelected(this.rowNode().node));

  protected onDblClick(event: MouseEvent): void {
    if (!this.ttSelectableRowDisabled()) this.tt.handleRowClick(event, this.rowNode().node);
  }
}

/** <int-treetable-checkbox>: checkbox of a row in selectionMode="checkbox", with partial state. */
@Component({
  selector: 'int-treetable-checkbox',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
    <!-- tabindex -1 as PrimeNG: the row handles Enter / Space -->
    <span
      class="int-treetable__checkbox"
      [class.int-treetable__checkbox--checked]="checked()"
      [class.int-treetable__checkbox--partial]="partial()"
      [class.int-treetable__checkbox--disabled]="disabled()"
      data-dep="checkbox"
    >
      <input
        type="checkbox"
        class="int-treetable__checkbox-input"
        tabindex="-1"
        [checked]="checked()"
        [indeterminate]="partial()"
        [disabled]="disabled()"
        [attr.aria-checked]="partial() ? 'mixed' : checked()"
        aria-label="Select row"
        (change)="onChange($event)"
      />
      <span class="int-treetable__checkbox-box" aria-hidden="true">
        @if (tt.checkboxIconTemplate(); as template) {
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: checked(), partialSelected: partial() }" />
        } @else if (checked()) {
          <i class="int-treetable__checkbox-icon icon icon-check"></i>
        } @else if (partial()) {
          <span class="int-treetable__checkbox-dash"></span>
        }
      </span>
    </span>
    <!-- /dep:checkbox -->
  `,
})
export class IntTreetableCheckbox {
  protected readonly tt = inject(IntTreetable);

  /** Nodo serializado de la fila. */
  readonly rowNode = input.required<IntTreetableNode>({ alias: 'value' });
  /** Deshabilita el checkbox. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly checked = computed(() => this.tt.isNodeSelected(this.rowNode().node));
  protected readonly partial = computed(() => this.tt.isNodePartialSelected(this.rowNode().node));

  protected onChange(event: Event): void {
    if (this.disabled()) return;
    this.tt.toggleCheckbox(this.rowNode().node, !this.checked());
    // The checkbox state comes from selectionKeys, not from the native input.
    (event.target as HTMLInputElement).checked = this.checked();
  }
}

/** <int-treetable-header-checkbox>: checks or unchecks every node. */
@Component({
  selector: 'int-treetable-header-checkbox',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
    <span
      class="int-treetable__checkbox"
      [class.int-treetable__checkbox--checked]="tt.allChecked()"
      [class.int-treetable__checkbox--disabled]="disabled()"
      data-dep="checkbox"
    >
      <input
        type="checkbox"
        class="int-treetable__checkbox-input"
        [checked]="tt.allChecked()"
        [disabled]="disabled()"
        aria-label="Select all"
        (change)="onChange($event)"
      />
      <span class="int-treetable__checkbox-box" aria-hidden="true">
        @if (tt.headerCheckboxIconTemplate(); as template) {
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: tt.allChecked() }" />
        } @else if (tt.allChecked()) {
          <i class="int-treetable__checkbox-icon icon icon-check"></i>
        }
      </span>
    </span>
    <!-- /dep:checkbox -->
  `,
})
export class IntTreetableHeaderCheckbox {
  protected readonly tt = inject(IntTreetable);

  // Same rule as PrimeNG: disabled while there are no nodes.
  protected readonly disabled = computed(() => !this.tt.value()?.length);

  protected onChange(event: Event): void {
    if (this.disabled()) return;
    this.tt.toggleAll(event, !this.tt.allChecked());
    (event.target as HTMLInputElement).checked = this.tt.allChecked();
  }
}

/** Everything a template needs to build a tree table, as PrimeNG's TreeTableModule. */
export const IntTreetableModule = [
  IntTreetable,
  IntTreetableRow,
  IntTreetableToggler,
  IntTreetableSortableColumn,
  IntTreetableSortIcon,
  IntTreetableSelectableRow,
  IntTreetableSelectableRowDblClick,
  IntTreetableCheckbox,
  IntTreetableHeaderCheckbox,
] as const;
