import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, Directive, ElementRef, inject, input,
  linkedSignal, numberAttribute, output, signal, TemplateRef, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Size of the table: small is the compact table of the knowledge base (PrimeNG Table size). */
export type IntTableSize = 'small';

/** Payload of onSort, same shape as PrimeNG SortMeta. */
export interface IntTableSortMeta {
  field: string;
  order: number;
}

/** Payload of sortFunction (customSort): the consumer sorts `data` in place, as PrimeNG SortEvent. */
export interface IntTableSortEvent {
  data: unknown[];
  mode: 'single';
  field: string;
  order: number;
}

/** Payload of onColReorder, same shape as PrimeNG TableColumnReorderEvent. */
export interface IntTableColumnReorderEvent {
  dragIndex: number;
  dropIndex: number;
  columns: unknown[];
}

/** Context of the #header and #emptymessage templates. */
export interface IntTableColumnsContext {
  $implicit: unknown[];
}

/** Context of the #body and #frozenbody templates, as PrimeNG (editing is false: no row editing yet). */
export interface IntTableBodyContext {
  $implicit: unknown;
  rowIndex: number;
  columns: unknown[];
  editing: boolean;
  frozen: boolean;
}

/** Context of the #sorticon template: 0 unsorted, 1 ascending, -1 descending. */
export interface IntTableSortIconContext {
  $implicit: number;
}

/** Position of the column reorder arrows, relative to the table host. */
interface IntTableReorderIndicator {
  left: number;
  top: number;
  bottom: number;
}

/** Reads a field by name or dot path (PrimeNG ObjectUtils.resolveFieldData). */
function resolveField(data: unknown, field: string): unknown {
  let value: unknown = data;
  for (const part of field.split('.')) {
    if (value == null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/** Same comparison as PrimeNG sortSingle: nulls first, strings with localeCompare, the rest with < and >. */
function compareValues(value1: unknown, value2: unknown): number {
  if (value1 == null && value2 != null) return -1;
  if (value1 != null && value2 == null) return 1;
  if (value1 == null && value2 == null) return 0;
  if (typeof value1 === 'string' && typeof value2 === 'string') return value1.localeCompare(value2);
  const a = value1 as number;
  const b = value2 as number;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Index of a header among its siblings that are reorderable (PrimeNG DomHandler.indexWithinGroup). */
function reorderIndex(element: HTMLElement): number {
  const siblings = Array.from(element.parentElement?.children ?? []);
  return siblings.filter((sibling) => sibling.hasAttribute('intreorderablecolumn')).indexOf(element);
}

/**
 * <int-table> · version 1. Replica of PrimeNG v20 p-table without PrimeNG at runtime.
 * DataTable displays data in tabular format. Scope: what the knowledge base documents or the projects use (caption,
 * empty message, single sort, compact size, scroll, striped rows and the Total frozen row) plus the column reorder of
 * Figma. Left out because no project uses them: dynamic columns, gridlines, row selection and expansion, column resize,
 * loading, footer and summary. The paginator goes below the table (int-paginator), the checkbox column is cell content
 * and loading data is shown with a skeleton of the table, as the knowledge base does.
 */
@Component({
  selector: 'int-table',
  templateUrl: './table.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-table puts its root classes on the host element.
  host: { '[class]': 'classes()' },
})
export class IntTable {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Filas que muestra la tabla. */
  readonly value = input<readonly unknown[] | null | undefined>([]);
  /** Columnas de la tabla; llegan a los templates y se reordenan con `reorderableColumns`. */
  readonly columns = input<readonly unknown[] | null | undefined>();
  /** Campo que identifica cada fila; se usa para seguir las filas al ordenar. */
  readonly dataKey = input<string>();
  /** Filas fijas que se muestran arriba del cuerpo con el template `frozenbody` (por ejemplo, la fila Total). */
  readonly frozenValue = input<readonly unknown[] | null | undefined>();
  /** Estilo en línea del elemento `table`. */
  readonly tableStyle = input<Record<string, string> | null>();
  /** Clase del elemento `table`. */
  readonly tableStyleClass = input<string>();
  /** Tamaño de la tabla: `small` para la tabla compacta o sin valor para el tamaño normal. */
  readonly size = input<IntTableSize>();
  /**
   * Alterna el fondo de las filas (cebra). En `int-*` viene activo porque la tabla del proyecto siempre es cebra.
   * @defaultValue true
   */
  readonly stripedRows = input(true, { transform: booleanAttribute });
  /**
   * Resalta la fila bajo el puntero. En `int-*` viene activo porque la tabla del proyecto siempre lo muestra.
   * @defaultValue true
   */
  readonly rowHover = input(true, { transform: booleanAttribute });

  /** Campo por el que se ordena al iniciar. */
  readonly sortField = input<string>();
  /**
   * Orden inicial: `1` ascendente, `-1` descendente.
   * @defaultValue 1
   */
  readonly sortOrder = input(1, { transform: numberAttribute });
  /**
   * Orden que se aplica la primera vez que se ordena una columna.
   * @defaultValue 1
   */
  readonly defaultSortOrder = input(1, { transform: numberAttribute });
  /** Si es `true`, la tabla no ordena: emite `sortFunction` para que quien la usa ordene los datos. */
  readonly customSort = input(false, { transform: booleanAttribute });

  /** Permite reordenar columnas arrastrando las cabeceras marcadas con `intReorderableColumn`. */
  readonly reorderableColumns = input(false, { transform: booleanAttribute });

  /** Fija la cabecera y hace scroll dentro de la tabla. */
  readonly scrollable = input(false, { transform: booleanAttribute });
  /** Alto máximo del área con scroll (`400px`) o `flex` para ocupar el alto del contenedor. */
  readonly scrollHeight = input<string>();

  /** Se emite al ordenar una columna, con el campo y el orden. */
  readonly onSort = output<IntTableSortMeta>();
  /** Con `customSort`, se emite para que quien usa la tabla ordene `data`. */
  readonly sortFunction = output<IntTableSortEvent>();
  /** Se emite al soltar una columna en otra posición, con los índices y las columnas reordenadas. */
  readonly onColReorder = output<IntTableColumnReorderEvent>();

  /** Template `caption`: contenido arriba de la tabla (título, buscador, acciones). */
  protected readonly captionTemplate = contentChild<TemplateRef<void>>('caption');
  /** Template `header`: filas del `thead`; recibe las columnas. */
  protected readonly headerTemplate = contentChild<TemplateRef<IntTableColumnsContext>>('header');
  /** Template `body`: una fila por dato; recibe el dato, `rowIndex` y las columnas. */
  protected readonly bodyTemplate = contentChild<TemplateRef<IntTableBodyContext>>('body');
  /** Template `frozenbody`: filas de `frozenValue`, arriba del cuerpo. */
  protected readonly frozenBodyTemplate = contentChild<TemplateRef<IntTableBodyContext>>('frozenbody');
  /** Template `emptymessage`: fila que se muestra cuando no hay datos. */
  protected readonly emptyMessageTemplate = contentChild<TemplateRef<IntTableColumnsContext>>('emptymessage');
  /** Template `sorticon`: reemplaza el ícono de orden; recibe el orden (`0`, `1` o `-1`). */
  readonly sortIconTemplate = contentChild<TemplateRef<IntTableSortIconContext>>('sorticon');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Current sort, started by sortField / sortOrder and changed by the sortable headers. */
  readonly activeSortField = linkedSignal(() => this.sortField());
  readonly activeSortOrder = linkedSignal(() => this.sortOrder());

  /** Rows on screen: a sorted copy of value (PrimeNG sorts value in place). customSort sets it after sortFunction. */
  protected readonly processedData = linkedSignal(() => this.sortRows([...(this.value() ?? [])]));

  /** Columns in their current order: a copy of columns, reordered by dragging the headers. */
  protected readonly orderedColumns = linkedSignal(() => [...(this.columns() ?? [])]);

  /** Column reorder: header being dragged, side of the drop and position of the arrows. */
  private draggedColumn: HTMLElement | null = null;
  private dropPosition: 1 | -1 | null = null;
  protected readonly reorderIndicator = signal<IntTableReorderIndicator | null>(null);

  protected readonly classes = computed(() => {
    const classes = ['int-table'];
    if (this.size()) classes.push(`int-table--${this.size()}`);
    if (this.stripedRows()) classes.push('int-table--striped');
    if (this.rowHover()) classes.push('int-table--hoverable');
    if (this.scrollable()) classes.push('int-table--scrollable');
    if (this.scrollable() && this.scrollHeight() === 'flex') classes.push('int-table--flex-scrollable');
    return classes.join(' ');
  });

  protected readonly tableClasses = computed(() => ['int-table__table', this.tableStyleClass()].filter(Boolean).join(' '));
  /** Same max-height as the inline style of PrimeNG table container ('flex' fills the host instead). */
  protected readonly containerMaxHeight = computed(() => {
    const scrollHeight = this.scrollHeight();
    return scrollHeight && scrollHeight !== 'flex' ? scrollHeight : null;
  });

  /** True when the field is the one the table is sorted by. */
  isSorted(field: string | undefined): boolean {
    return !!field && this.activeSortField() === field;
  }

  /** Sort order of a field: 0 unsorted, 1 ascending, -1 descending. */
  sortOrderOf(field: string | undefined): number {
    return this.isSorted(field) ? this.activeSortOrder() : 0;
  }

  /** Sorts by a field, as PrimeNG sort(): the same field toggles the order, a new one starts at defaultSortOrder. */
  sort(field: string): void {
    const order = this.activeSortField() === field ? this.activeSortOrder() * -1 : this.defaultSortOrder();
    this.activeSortField.set(field);
    this.activeSortOrder.set(order);
    if (this.customSort()) {
      const data = [...(this.value() ?? [])];
      this.sortFunction.emit({ data, mode: 'single', field, order });
      this.processedData.set(data);
    }
    this.onSort.emit({ field, order });
  }

  protected trackRow(index: number, row: unknown): unknown {
    const dataKey = this.dataKey();
    return dataKey ? resolveField(row, dataKey) : index;
  }

  private sortRows(rows: unknown[]): unknown[] {
    const field = this.activeSortField();
    const order = this.activeSortOrder();
    if (!field || !order || this.customSort()) return rows;
    return rows.sort((row1, row2) => order * compareValues(resolveField(row1, field), resolveField(row2, field)));
  }

  // --- column reorder (PrimeNG onColumnDragStart / onColumnDragEnter / onColumnDrop) ---

  /** Called by [intReorderableColumn] on dragstart. */
  columnDragStart(event: DragEvent, column: HTMLElement): void {
    this.draggedColumn = column;
    event.dataTransfer?.setData('text', 'b'); // For Firefox, as PrimeNG
  }

  /** Called by [intReorderableColumn] on dragenter: shows the arrows on the side of the drop. */
  columnDragEnter(event: DragEvent, dropHeader: HTMLElement): void {
    if (!this.reorderableColumns() || !this.draggedColumn) return;
    event.preventDefault();
    if (this.draggedColumn === dropHeader) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      return;
    }
    const container = this.host.nativeElement.getBoundingClientRect();
    const header = dropHeader.getBoundingClientRect();
    const after = event.clientX > header.left + header.width / 2;
    this.dropPosition = after ? 1 : -1;
    this.reorderIndicator.set({
      left: (after ? header.right : header.left) - container.left,
      top: header.top - container.top,
      bottom: header.bottom - container.top,
    });
  }

  /** Called by [intReorderableColumn] on dragleave. */
  columnDragLeave(event: DragEvent): void {
    if (this.reorderableColumns() && this.draggedColumn) event.preventDefault();
  }

  /** Called by [intReorderableColumn] on drop: moves the column, same index rules as PrimeNG onColumnDrop. */
  columnDrop(event: DragEvent, dropColumn: HTMLElement): void {
    event.preventDefault();
    if (!this.draggedColumn) return;
    const dragIndex = reorderIndex(this.draggedColumn);
    let dropIndex = reorderIndex(dropColumn);
    let allowDrop = dragIndex !== dropIndex;
    if (
      allowDrop &&
      ((dropIndex - dragIndex === 1 && this.dropPosition === -1) || (dragIndex - dropIndex === 1 && this.dropPosition === 1))
    ) {
      allowDrop = false;
    }
    if (allowDrop && dropIndex < dragIndex && this.dropPosition === 1) dropIndex += 1;
    if (allowDrop && dropIndex > dragIndex && this.dropPosition === -1) dropIndex -= 1;
    if (allowDrop) {
      const columns = [...this.orderedColumns()];
      columns.splice(dropIndex, 0, ...columns.splice(dragIndex, 1));
      this.orderedColumns.set(columns);
      this.onColReorder.emit({ dragIndex, dropIndex, columns });
    }
    this.columnDragEnd();
  }

  /** Clears the drag state; also on dragend, so the arrows hide when the drop happens outside the headers. */
  columnDragEnd(): void {
    if (this.draggedColumn) this.draggedColumn.draggable = false;
    this.draggedColumn = null;
    this.dropPosition = null;
    this.reorderIndicator.set(null);
  }
}

/**
 * [intSortableColumn] · replica of PrimeNG v20 pSortableColumn: the header sorts the table by its field on click,
 * Enter or Space, and exposes the order with aria-sort.
 */
@Directive({
  selector: '[intSortableColumn]',
  host: {
    '[class.int-table__sortable-column]': '!intSortableColumnDisabled()',
    '[class.int-table__sortable-column--sorted]': 'sorted()',
    '[attr.tabindex]': 'intSortableColumnDisabled() ? null : 0',
    role: 'columnheader',
    '[attr.aria-sort]': 'ariaSort()',
    '(click)': 'sort()',
    '(keydown.enter)': 'sortWithKey($event)',
    '(keydown.space)': 'sortWithKey($event)',
  },
})
export class IntSortableColumn {
  /** Campo por el que ordena la columna (el valor de `pSortableColumn`). */
  readonly intSortableColumn = input<string>('');
  /** Deshabilita el orden de la columna. */
  readonly intSortableColumnDisabled = input(false, { transform: booleanAttribute });

  private readonly table = inject(IntTable);

  protected readonly sorted = computed(() => !this.intSortableColumnDisabled() && this.table.isSorted(this.intSortableColumn()));
  protected readonly ariaSort = computed(() => {
    if (this.intSortableColumnDisabled()) return null;
    const order = this.table.sortOrderOf(this.intSortableColumn());
    return order === 1 ? 'ascending' : order === -1 ? 'descending' : 'none';
  });

  protected sort(): void {
    if (this.intSortableColumnDisabled()) return;
    this.table.sort(this.intSortableColumn());
    // A double click on a header must not select its text, as PrimeNG DomHandler.clearSelection().
    window.getSelection()?.removeAllRanges();
  }

  protected sortWithKey(event: Event): void {
    this.sort();
    event.preventDefault();
  }
}

/**
 * <int-sort-icon> · replica of PrimeNG v20 p-sortIcon: arrow of the sort state of a field, or the #sorticon
 * template of the table.
 */
@Component({
  selector: 'int-sort-icon',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-table__sort' },
  template: `
    @if (table.sortIconTemplate(); as sortIconTemplate) {
      <span class="int-table__sort-icon">
        <ng-container *ngTemplateOutlet="sortIconTemplate; context: { $implicit: sortOrder() }" />
      </span>
    } @else {
      <!-- Same glyphs as the Style Guide: arrow down unsorted and descending, arrow up ascending -->
      <i
        class="int-table__sort-icon icon"
        [class.icon-nav-up]="sortOrder() === 1"
        [class.icon-nav-down]="sortOrder() !== 1"
        aria-hidden="true"
      ></i>
    }
  `,
})
export class IntSortIcon {
  /** Campo de la columna; el ícono muestra si la tabla está ordenada por él y en qué sentido. */
  readonly field = input<string>('');

  protected readonly table = inject(IntTable);
  protected readonly sortOrder = computed(() => this.table.sortOrderOf(this.field()));
}

/**
 * [intReorderableColumn] · replica of PrimeNG v20 pReorderableColumn: with reorderableColumns on the table, the header
 * can be dragged onto another one to move the column. Mouse only, as PrimeNG.
 */
@Directive({
  selector: '[intReorderableColumn]',
  host: {
    '[class.int-table__reorderable-column]': 'enabled()',
    '(mousedown)': 'mouseDown($event)',
    '(dragstart)': 'dragStart($event)',
    '(dragover)': 'dragOver($event)',
    '(dragenter)': 'dragEnter($event)',
    '(dragleave)': 'dragLeave($event)',
    '(drop)': 'drop($event)',
    '(dragend)': 'dragEnd()',
  },
})
export class IntReorderableColumn {
  /** Marca la cabecera como arrastrable (sin valor, como `pReorderableColumn`). */
  readonly intReorderableColumn = input<string>('');
  /** Deshabilita el arrastre de la columna. */
  readonly intReorderableColumnDisabled = input(false, { transform: booleanAttribute });

  private readonly table = inject(IntTable);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly enabled = computed(() => this.table.reorderableColumns() && !this.intReorderableColumnDisabled());

  // A field inside the header keeps its own text selection instead of starting a drag.
  protected mouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.host.nativeElement.draggable = this.enabled() && target.nodeName !== 'INPUT' && target.nodeName !== 'TEXTAREA';
  }

  protected dragStart(event: DragEvent): void {
    if (this.enabled()) this.table.columnDragStart(event, this.host.nativeElement);
  }

  protected dragOver(event: DragEvent): void {
    if (this.enabled()) event.preventDefault();
  }

  protected dragEnter(event: DragEvent): void {
    if (this.enabled()) this.table.columnDragEnter(event, this.host.nativeElement);
  }

  protected dragLeave(event: DragEvent): void {
    if (this.enabled()) this.table.columnDragLeave(event);
  }

  protected drop(event: DragEvent): void {
    if (this.enabled()) this.table.columnDrop(event, this.host.nativeElement);
  }

  protected dragEnd(): void {
    if (this.enabled()) this.table.columnDragEnd();
  }
}
