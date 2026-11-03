import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

/** <int-demo> · version 2: header with icon and counter, accent bar on top. */
@Component({
  selector: 'int-demo',
  templateUrl: './demo.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The root class lives on the host; each modifier is an input that sets its int-demo--* class.
  host: {
    class: 'int-demo',
    '[class.int-demo--outlined]': 'outlined()',
  },
})
export class IntDemo {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = '';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Título del bloque, en el encabezado junto al icono y al contador. */
  readonly title = input('');
  /** Clase del icono del Style Guide (`icon-*`), p. ej. `icon-file`. */
  readonly icon = input('icon-file');
  /** Filas de la lista, en orden; el contador del encabezado muestra cuántas son. */
  readonly items = input<readonly string[]>([]);
  /** Borde visible en lugar de la sombra (modificador `int-demo--outlined`); la barra de acento se mantiene. */
  readonly outlined = input(false, { transform: booleanAttribute });
}
