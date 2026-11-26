import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Horizontal alignment of the cells of a column (head and body); left when omitted. */
export type IntLitetableAlign = 'left' | 'center' | 'right';

/** Space scale of cellSpacing and cellPadding: small 4px · medium 12px · large 16px (none when omitted). */
export type IntLitetableSpacing = 'small' | 'medium' | 'large';

/** Column of the table: field of the row it shows, optional head text and alignment. */
export interface IntLitetableColumn {
  /** Field of each row shown in the column (name or dot path: `meta.total`). */
  readonly field: string;
  /** Text of the head cell; the head row is shown when at least one column has it. */
  readonly header?: string;
  /** Alignment of the column cells; left when omitted. */
  readonly align?: IntLitetableAlign;
}

/** Cell of the head row above `columns`: it can cover several columns (colspan) or both head rows (rowspan). */
export interface IntLitetableColumnGroup {
  /** Text of the group cell. */
  readonly header?: string;
  /** Columns it covers; 1 when omitted. */
  readonly colspan?: number;
  /** 2 to also cover the head row of `columns` (a column without group, as "Category"); 1 when omitted. */
  readonly rowspan?: number;
  /** Alignment of the group cell; left when omitted. */
  readonly align?: IntLitetableAlign;
}

/** Merge of a body cell, given in the `spans` field of the row by column field. */
export interface IntLitetableCellSpan {
  /** Columns the cell covers to the right; 1 when omitted. */
  readonly colspan?: number;
  /** Rows the cell covers downwards; 1 when omitted. */
  readonly rowspan?: number;
}

/** Row of `value`: its fields plus, optionally, `spans` with the merges of its cells by column field. */
export interface IntLitetableRow {
  readonly spans?: Readonly<Record<string, IntLitetableCellSpan>>;
  readonly [field: string]: unknown;
}

/** Rendered cell: the column it starts on, its index and its merge. */
interface LitetableCell {
  readonly column: IntLitetableColumn;
  readonly index: number;
  readonly colspan: number;
  readonly rowspan: number;
}

/** Context of the #cell template. */
export interface IntLitetableCellContext {
  /** Value of the field of the column in the row. */
  readonly $implicit: unknown;
  readonly row: object;
  readonly column: IntLitetableColumn;
  readonly rowIndex: number;
}

/** Reads a field by name or dot path, as int-table (PrimeNG ObjectUtils.resolveFieldData). */
function resolveField(row: object, field: string): unknown {
  return field
    .split('.')
    .reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), row);
}

/** Whole number between min and max (a span from the data can be anything). */
function clampSpan(value: number | undefined, max: number): number {
  const span = Math.floor(Number(value) || 1);
  return Math.min(Math.max(span, 1), Math.max(max, 1));
}

/**
 * showGridlines and cellBackground: the bare attribute or `true` uses the default color; a string uses that
 * color (`#fde8e8`, `var(--i-background-subtle)`); `false` or no input turns it off.
 */
function colorAttribute(value: boolean | string | null | undefined): boolean | string {
  if (value === '' || value === true || value === 'true') return true;
  return typeof value === 'string' && value !== 'false' ? value : false;
}

/**
 * <int-litetable> · version 1. int-* extension: it has no PrimeNG equivalent (knowledge base pattern table-lite).
 * Aligns plain text in rows and columns: no borders, background, sorting, paging or selection. Meant for chart
 * tooltips, popovers and quick summaries. A native <table> inside (the pattern uses divs with display: table),
 * because only native cells merge with colspan / rowspan.
 */
@Component({
  selector: 'int-litetable',
  templateUrl: './litetable.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The host wraps the <table> and takes the width of its content, so [style]="{ width }" sizes it; single
  // class bindings keep the consumer's own classes. The modifiers live here and the table inherits their tokens.
  host: {
    class: 'int-litetable',
    '[class.int-litetable--full-first-column]': 'fullFirstColumn()',
    '[class.int-litetable--gridlines]': 'showGridlines() !== false',
    '[style.--int-litetable-gridlines-border-color]': 'gridlinesColor()',
    '[class.int-litetable--cell-background]': 'cellBackground() !== false',
    '[style.--int-litetable-cell-background-color]': 'cellBackgroundColor()',
    '[class.int-litetable--cell-spacing-small]': "cellSpacing() === 'small'",
    '[class.int-litetable--cell-spacing-medium]': "cellSpacing() === 'medium'",
    '[class.int-litetable--cell-spacing-large]': "cellSpacing() === 'large'",
    '[class.int-litetable--cell-padding-small]': "cellPadding() === 'small'",
    '[class.int-litetable--cell-padding-medium]': "cellPadding() === 'medium'",
    '[class.int-litetable--cell-padding-large]': "cellPadding() === 'large'",
  },
})
export class IntLitetable {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /**
   * int-* extension: filas que muestra la tabla; cada columna lee su `field` de cada fila. Una fila puede traer
   * `spans` para combinar celdas: `spans: { category: { colspan: 2 } }` (la celda abarca columnas a la derecha)
   * o `spans: { brand: { rowspan: 2 } }` (abarca filas hacia abajo). Las celdas cubiertas no se dibujan.
   */
  readonly value = input<readonly object[] | null | undefined>([]);
  /**
   * int-* extension: columnas de la tabla (`field`, `header` y `align`). La fila de cabecera se muestra si al
   * menos una columna tiene `header`.
   */
  readonly columns = input<readonly IntLitetableColumn[] | null | undefined>([]);
  /**
   * int-* extension: fila de cabecera agrupada, encima de la de `columns`. Cada grupo (`header`, `colspan`,
   * `rowspan`, `align`) abarca `colspan` columnas; con `rowspan: 2` ocupa también la fila de `columns`, para una
   * columna sin grupo.
   */
  readonly columnGroups = input<readonly IntLitetableColumnGroup[] | null | undefined>([]);
  /**
   * int-* extension: la primera columna ocupa todo el ancho disponible y lleva las demás al borde derecho.
   * Pensado para tooltips y popovers con pares etiqueta/valor.
   */
  readonly fullFirstColumn = input(false, { transform: booleanAttribute });
  /**
   * Dibuja un borde en cada celda, como `showGridlines` de PrimeNG Table. Sin `cellSpacing`, las celdas vecinas
   * comparten una sola línea. int-* extension: solo el atributo usa el color de borde del Style Guide; con un
   * valor usa ese color (`showGridlines="#d0d5dd"` o `showGridlines="var(--i-border-accent)"`).
   */
  readonly showGridlines = input<boolean | string, boolean | string | null | undefined>(false, {
    transform: colorAttribute,
  });
  /**
   * int-* extension: pinta el fondo de todas las celdas. Solo el atributo (`cellBackground`) usa el blanco del
   * Style Guide; con un valor usa ese color (`cellBackground="#fde8e8"` o `cellBackground="var(--i-background-subtle)"`).
   * Una celda puede tener su propio color con `intLitetableCellBackground` en el template `cell`. El espacio de
   * `cellSpacing` deja ver el fondo de atrás.
   */
  readonly cellBackground = input<boolean | string, boolean | string | null | undefined>(false, {
    transform: colorAttribute,
  });
  /**
   * int-* extension: espacio entre celdas (`border-spacing`, como el `cellspacing` de una tabla HTML): `small`,
   * `medium` o `large`. También queda en el borde exterior de la tabla. Sin él, las celdas van juntas.
   */
  readonly cellSpacing = input<IntLitetableSpacing>();
  /**
   * int-* extension: espacio interno de cada celda (`padding`, como el `cellpadding` de una tabla HTML): `small`,
   * `medium` o `large`. Sin él, las celdas no tienen padding.
   */
  readonly cellPadding = input<IntLitetableSpacing>();
  /** int-* extension: etiqueta accesible de la tabla (`aria-label`). */
  readonly ariaLabel = input<string>();
  /** int-* extension: id del elemento que etiqueta la tabla (`aria-labelledby`), p. ej. el título del tooltip. */
  readonly ariaLabelledBy = input<string>();

  /**
   * int-* extension: contenido de cada celda del cuerpo, con el valor (`let-value`), la fila (`let-row="row"`),
   * la columna (`let-column="column"`) y su índice (`let-rowIndex="rowIndex"`). Sin él, la celda muestra el valor como texto.
   */
  readonly cellTemplate = contentChild<TemplateRef<IntLitetableCellContext>>('cell');

  protected readonly cols = computed(() => this.columns() ?? []);
  protected readonly groups = computed(() => this.columnGroups() ?? []);

  /** Head cells of `columns`, without the ones a group with rowspan already covers. */
  protected readonly headerCells = computed<LitetableCell[]>(() => {
    const cols = this.cols();
    if (!cols.some((column) => !!column.header)) return [];
    const covered = new Set<number>();
    let position = 0;
    for (const group of this.groups()) {
      const colspan = clampSpan(group.colspan, cols.length - position);
      if (clampSpan(group.rowspan, 2) > 1) {
        for (let i = position; i < position + colspan; i++) covered.add(i);
      }
      position += colspan;
    }
    return cols
      .map((column, index) => ({ column, index, colspan: 1, rowspan: 1 }))
      .filter((cell) => !covered.has(cell.index));
  });

  /** Group cells with their merge already limited to the columns that exist. */
  protected readonly groupCells = computed(() => {
    const total = this.cols().length;
    const twoRows = this.headerCells().length > 0;
    let position = 0;
    return this.groups().map((group) => {
      const colspan = clampSpan(group.colspan, total - position);
      position += colspan;
      return { group, colspan, rowspan: twoRows ? clampSpan(group.rowspan, 2) : 1 };
    });
  });

  /**
   * Body rows with the cells to draw: a cell with colspan / rowspan (row.spans) covers its neighbours to the
   * right and below, and the covered positions are skipped, as a native table expects.
   */
  protected readonly bodyRows = computed(() => {
    const rows = this.value() ?? [];
    const cols = this.cols();
    const covered = new Set<string>();
    return rows.map((row, rowIndex) => {
      const spans = (row as IntLitetableRow).spans;
      const cells: LitetableCell[] = [];
      cols.forEach((column, index) => {
        if (covered.has(`${rowIndex}:${index}`)) return;
        const span = spans?.[column.field];
        const colspan = clampSpan(span?.colspan, cols.length - index);
        const rowspan = clampSpan(span?.rowspan, rows.length - rowIndex);
        for (let r = rowIndex; r < rowIndex + rowspan; r++) {
          for (let c = index; c < index + colspan; c++) covered.add(`${r}:${c}`);
        }
        cells.push({ column, index, colspan, rowspan });
      });
      return { row, cells };
    });
  });
  /** Color given to showGridlines; null keeps the default token. */
  protected readonly gridlinesColor = computed(() => {
    const value = this.showGridlines();
    return typeof value === 'string' ? value : null;
  });
  /** Color given to cellBackground; null keeps the default token. */
  protected readonly cellBackgroundColor = computed(() => {
    const value = this.cellBackground();
    return typeof value === 'string' ? value : null;
  });

  protected cellValue(row: object, column: IntLitetableColumn): unknown {
    return resolveField(row, column.field);
  }
}

/**
 * [intLitetableCellBackground] · paints the background of the int-litetable cell that contains it. It goes on an
 * element of the #cell template, so one cell gets its own color over the cellBackground of the table.
 */
@Directive({ selector: '[intLitetableCellBackground]' })
export class IntLitetableCellBackground {
  /**
   * int-* extension: color de fondo de la celda que contiene el elemento (`#fde8e8`, `var(--i-background-warning)`).
   * Va dentro del template `cell`; sin valor, la celda vuelve al fondo de la tabla.
   */
  readonly intLitetableCellBackground = input<string | null | undefined>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // The template content is a child of .int-litetable__cell: the color goes on the cell as its own token.
    effect(() => {
      const cell = this.host.nativeElement.closest<HTMLElement>('.int-litetable__cell');
      const color = this.intLitetableCellBackground();
      if (!cell) return;
      if (color) cell.style.setProperty('--int-litetable-cell-background', color);
      else cell.style.removeProperty('--int-litetable-cell-background');
    });
    inject(DestroyRef).onDestroy(() =>
      this.host.nativeElement
        .closest<HTMLElement>('.int-litetable__cell')
        ?.style.removeProperty('--int-litetable-cell-background'),
    );
  }
}
