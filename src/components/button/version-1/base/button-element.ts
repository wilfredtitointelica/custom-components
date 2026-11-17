import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
  numberAttribute,
} from '@angular/core';

import { IntSeverity, IntSize } from '../../../_shared_';
import { IntButton, IntButtonIconPos, IntButtonVariant } from './button';

/**
 * <int-button> · version 1. Element form of the button (PrimeNG v20 `p-button`); it renders a native
 * `<button intButton>` inside, so styles, modifiers, loading/disabled and ARIA are the same as
 * `button[intButton]` (PrimeNG `pButton`). Projected content goes inside the native button.
 *
 * Use `button[intButton]` / `a[intButton]` when you need the native element itself (links, form
 * attributes, directives on the button); `<int-button>` for PrimeNG-style markup.
 * Deviation: `badge`, `raised`, `plain` and `buttonProps` are not implemented.
 *
 * @example
 * <int-button label="Save" icon="icon icon-check" (onClick)="save()" />
 * <int-button type="submit" severity="secondary" size="small">Send</int-button>
 */
@Component({
  selector: 'int-button',
  templateUrl: './button-element.html',
  imports: [IntButton],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntButtonElement {
  /** Texto del botón. */
  readonly label = input<string | undefined>(undefined);
  /** Clase del icono, p. ej. `icon icon-download`. */
  readonly icon = input<string | undefined>(undefined);
  /** Posición del icono respecto al texto: `left`, `right`, `top` o `bottom`. */
  readonly iconPos = input<IntButtonIconPos>('left');
  /** Color según la intención: `primary`, `secondary`, `success`, `danger`… */
  readonly severity = input<IntSeverity>('primary');
  /**
   * Aspecto: `outlined` (solo borde), `text` (sin fondo ni borde) o `link`. Con `text`, icono y sin `label`
   * queda el botón de solo icono: una caja de 24px (16px en `small`, 32px en `large`) que se pone azul al pasar
   * el mouse.
   */
  readonly variant = input<IntButtonVariant | undefined>(undefined);
  /** Tamaño: `small` o `large`; sin valor, el tamaño normal. */
  readonly size = input<IntSize | undefined>(undefined);
  /** Bordes completamente redondeados. */
  readonly rounded = input(false, { transform: booleanAttribute });
  /** Ocupa todo el ancho de su contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Muestra el indicador de carga y bloquea el clic. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Deshabilita el botón. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Nombre accesible; obligatorio en los botones de solo icono. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /**
   * int-* extension: el texto queda oculto hasta pasar el mouse o enfocar con el teclado (botón de ayuda); sigue
   * siendo el nombre accesible.
   */
  readonly labelOnHover = input(false, { transform: booleanAttribute });
  /** int-* extension: mantiene el aspecto presionado y marca `aria-pressed`. */
  readonly active = input<boolean | undefined>(undefined);
  /**
   * `tabindex` del botón (como en PrimeNG), p. ej. `-1` para sacarlo del orden de `Tab` cuando otro elemento
   * maneja el teclado. Un `<a intButton>` deshabilitado usa siempre `-1`.
   */
  readonly tabindex = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** `type` nativo del botón interno. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** Enfoca el botón al cargarse la vista. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Clases extra para el botón nativo interno. */
  readonly styleClass = input<string | undefined>(undefined);

  /** Se emite al hacer clic. */
  readonly onClick = output<MouseEvent>();
  /** Se emite cuando el botón recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el botón pierde el foco. */
  readonly onBlur = output<FocusEvent>();
}
