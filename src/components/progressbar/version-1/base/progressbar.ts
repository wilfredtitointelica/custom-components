import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  numberAttribute,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Modes of p-progressbar. */
export type IntProgressbarMode = 'determinate' | 'indeterminate';

/** int-* extension: status colors of the bar (in progress, completed, warning, error). */
export type IntProgressbarSeverity = 'info' | 'success' | 'warn' | 'danger';

/** Context of the `content` template: the current value, as in PrimeNG. */
export interface IntProgressbarContentContext {
  $implicit: number | undefined;
}

/**
 * <int-progressbar> · version 1. Replica of PrimeNG v20 p-progressbar without PrimeNG at runtime.
 * A process status indicator: a determinate bar with its value or an indeterminate animation.
 */
@Component({
  selector: 'int-progressbar',
  templateUrl: './progressbar.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-progressbar puts its root classes and ARIA on the host element.
  // Differences: PrimeNG documents role="progressbar" but omits it, sets aria-valuenow in indeterminate
  // mode and puts the text in aria-level; here the role is set, aria-valuenow only when determinate and
  // the text goes to aria-valuetext.
  host: {
    role: 'progressbar',
    '[class]': 'classes()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'determinate() ? (value() ?? null) : null',
    '[attr.aria-valuetext]': 'determinate() && value() != null ? value() + unit() : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
  },
})
export class IntProgressbar {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Valor actual del progreso, de 0 a 100. */
  readonly value = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Muestra el valor dentro de la barra. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Unidad que se agrega después del valor. */
  readonly unit = input('%');
  /** Modo del progreso: `determinate` (con valor) o `indeterminate` (animación continua). */
  readonly mode = input<IntProgressbarMode>('determinate');
  /**
   * Color de fondo de la barra de progreso: un valor propio (hexadecimal como `#738fe1` o `var(--i-color-…)`).
   * Sin valor usa el color por defecto o el de `severity`; con valor, pisa a `severity`.
   */
  readonly color = input<string>();
  /**
   * int-* extension: color del texto del valor dentro de la barra: un valor propio (hexadecimal o
   * `var(--i-color-…)`). Sin valor es claro, para leerse sobre cualquier color de barra.
   */
  readonly labelColor = input<string>();
  /** Clase de estilo del elemento de la barra de progreso. */
  readonly valueStyleClass = input<string>();
  /**
   * int-* extension: color de estado de la barra: `info` (en progreso), `success` (completado), `warn` o
   * `danger` (error). Sin valor usa el color por defecto.
   */
  readonly severity = input<IntProgressbarSeverity | null>();
  /**
   * int-* extension: porcentaje (0 a 100) donde se dibuja una línea vertical de referencia, para comparar
   * el valor contra un mínimo. Solo en modo `determinate`.
   */
  readonly threshold = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /**
   * int-* extension: estado deshabilitado (proceso pausado o no disponible): colores neutros que pisan a
   * `severity`, `color` y `labelColor`, y la animación de `indeterminate` se detiene.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** int-* extension: texto accesible de la barra (`aria-label`), con el nombre que PrimeNG usa en otros componentes. */
  readonly ariaLabel = input<string>();
  /** int-* extension: id del elemento que etiqueta la barra (`aria-labelledby`), con el nombre que PrimeNG usa en otros componentes. */
  readonly ariaLabelledBy = input<string>();

  /** Template del contenido: `<ng-template #content let-value>…</ng-template>`; reemplaza la etiqueta del valor. */
  protected readonly contentTemplate = contentChild<TemplateRef<IntProgressbarContentContext>>('content', {
    descendants: false,
  });

  protected readonly determinate = computed(() => this.mode() === 'determinate');

  /** Block plus active modifiers, as PrimeNG's root classes. */
  protected readonly classes = computed(() => {
    const severity = this.severity();
    return [
      'int-progressbar',
      `int-progressbar--${this.mode()}`,
      severity ? `int-progressbar--${severity}` : '',
      this.disabled() ? 'int-progressbar--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly valueClass = computed(() =>
    `int-progressbar__value ${this.valueStyleClass() ?? ''}`.trim(),
  );

  /** Width of the value bar; without a value the bar is empty, as PrimeNG's CSS default (width: 0%). */
  protected readonly width = computed(() => `${this.value() ?? 0}%`);

  /** Same condition as PrimeNG: the label hides while the value is empty or 0. */
  protected readonly labelVisible = computed(() => {
    const value = this.value();
    return value != null && value !== 0;
  });

  protected readonly hasThreshold = computed(() => {
    const threshold = this.threshold();
    return this.determinate() && threshold != null && !Number.isNaN(threshold);
  });

  // Disabled drops the custom colors: they are inline on the elements and would win over the modifier.
  protected readonly valueColor = computed(() => (this.disabled() ? undefined : this.color()));
  protected readonly labelTextColor = computed(() => (this.disabled() ? undefined : this.labelColor()));

  protected readonly context =computed<IntProgressbarContentContext>(() => ({ $implicit: this.value() }));
}
