import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Horizontal alignment of the cells of a column (head and body); left when omitted. */
export type IntLitetableAlign = 'left' | 'center' | 'right';

/** Column of the table built from data: field of the row it shows, optional head text and alignment. */
export interface IntLitetableColumn {
  /** Field of each row shown in the column (name or dot path: `meta.total`). */
  readonly field: string;
  /** Text of the head cell; the head row is shown when at least one column has it. */
  readonly header?: string;
  /** Alignment of the column cells; left when omitted. */
  readonly align?: IntLitetableAlign;
}

/** Space scale of cellSpacing and cellPadding: small 4px · medium 12px · large 16px (none when omitted). */
export type IntLitetableSpacing = 'small' | 'medium' | 'large';

/** Context of the #body template, as PrimeNG Table: the row (`let-row`) and its index (`let-rowIndex="rowIndex"`). */
export interface IntLitetableBodyContext<T = unknown> {
  readonly $implicit: T;
  readonly rowIndex: number;
}

/** Reads a field by name or dot path, as int-table (PrimeNG ObjectUtils.resolveFieldData). */
function resolveField(row: unknown, field: string): unknown {
  return field
    .split('.')
    .reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), row);
}

/**
 * showGridlines and cellBackground: the bare attribute or `true` uses the default color; a string uses that
 * color (`#fde8e8`, `var(--i-background-subtle)`); `false` or no input turns it off.
 */
function colorAttribute(value: boolean | string | null | undefined): boolean | string {
  if (value === '' || value === true || value === 'true') return true;
  return typeof value === 'string' && value !== 'false' ? value : false;
}

/** The color of a colorAttribute input, or null to keep the default token. */
function colorOf(value: boolean | string): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * <int-litetable> · version 1. The simplest form of PrimeNG p-table: the component owns the <table>, <thead>,
 * <tbody> and <tfoot> (and their styles), and the consumer writes the rows in the #header, #body and #footer
 * templates with native tr / th / td, so cells merge with colspan / rowspan. Without templates, `columns` builds
 * the head and body rows from the data.
 * int-* extension: it has no PrimeNG equivalent of its own (knowledge base pattern table-lite): plain text,
 * no borders, background, sorting, paging or selection. Meant for tooltips, popovers and quick summaries.
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
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Filas de la tabla: el template `body` se repite una vez por fila. */
  readonly value = input<readonly unknown[] | null | undefined>([]);
  /**
   * int-* extension: columnas para armar la tabla solo con datos, sin templates: `field` (nombre o ruta con
   * puntos), `header` y `align` (`left`, `center`, `right`). Los templates `header` y `body`, si están, la reemplazan.
   */
  readonly columns = input<readonly IntLitetableColumn[] | null | undefined>([]);
  /**
   * int-* extension: la primera columna ocupa todo el ancho disponible y lleva las demás al borde derecho.
   * Pensado para tooltips y popovers con pares etiqueta/valor. Toma la primera celda de cada fila.
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
   * Una celda puede tener su propio color con `intLitetableCellBackground` en su `td`. El espacio de
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
  /** Etiqueta accesible de la tabla (`aria-label`). */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta la tabla (`aria-labelledby`), p. ej. el título del tooltip. */
  readonly ariaLabelledBy = input<string>();

  /** Filas de la cabecera (`thead`): uno o más `tr` con sus `th`; `colspan` y `rowspan` agrupan columnas. */
  readonly headerTemplate = contentChild<TemplateRef<void>>('header');
  /**
   * Fila del cuerpo (`tbody`), una vez por cada elemento de `value`, con la fila (`let-row`) y su índice
   * (`let-rowIndex="rowIndex"`). Puede tener más de un `tr` (por ejemplo, con `rowspan`).
   */
  readonly bodyTemplate = contentChild<TemplateRef<IntLitetableBodyContext>>('body');
  /** Filas del pie (`tfoot`), como una fila de total. */
  readonly footerTemplate = contentChild<TemplateRef<void>>('footer');

  protected readonly rows = computed(() => this.value() ?? []);
  protected readonly cols = computed(() => this.columns() ?? []);
  protected readonly hasColumnHeader = computed(() => this.cols().some((column) => column.header));
  protected readonly field = resolveField;
  protected readonly gridlinesColor = computed(() => colorOf(this.showGridlines()));
  protected readonly cellBackgroundColor = computed(() => colorOf(this.cellBackground()));
}

/**
 * td[intLitetableCellBackground] · paints one cell of an int-litetable over the cellBackground of the table.
 */
@Directive({
  selector: 'td[intLitetableCellBackground], th[intLitetableCellBackground]',
  host: { '[style.--int-litetable-cell-background]': 'intLitetableCellBackground() || null' },
})
export class IntLitetableCellBackground {
  /**
   * int-* extension: color de fondo de la celda (`#fde8e8`, `var(--i-background-warning)`). Va en un `td` o `th`
   * de los templates; sin valor, la celda vuelve al fondo de la tabla.
   */
  readonly intLitetableCellBackground = input<string | null | undefined>();
}
