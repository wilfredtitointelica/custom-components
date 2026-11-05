import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Side of the line where the content goes: left/right/alternate (vertical), top/bottom/alternate (horizontal). */
export type IntTimelineAlign = 'left' | 'right' | 'alternate' | 'top' | 'bottom';

/** Orientation of the timeline. */
export type IntTimelineLayout = 'vertical' | 'horizontal';

/** Context of the content, opposite and marker templates: the event of the row. */
export interface IntTimelineTemplateContext {
  $implicit: unknown;
}

/**
 * <int-timeline> · version 1. Replica of PrimeNG v20 p-timeline without PrimeNG at runtime.
 * Each event is a row: opposite side, separator (marker + connector) and content.
 */
@Component({
  selector: 'int-timeline',
  templateUrl: './timeline.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-timeline puts p-timeline-<align> and p-timeline-<layout> on the host.
  // Single class bindings keep the consumer's own classes on the host.
  host: {
    class: 'int-timeline',
    '[class.int-timeline--vertical]': "layout() === 'vertical'",
    '[class.int-timeline--horizontal]': "layout() === 'horizontal'",
    '[class.int-timeline--left]': "align() === 'left'",
    '[class.int-timeline--right]': "align() === 'right'",
    '[class.int-timeline--alternate]': "align() === 'alternate'",
    '[class.int-timeline--top]': "align() === 'top'",
    '[class.int-timeline--bottom]': "align() === 'bottom'",
    '[class.int-timeline--disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class IntTimeline {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Lista de eventos que se muestran. */
  readonly value = input<readonly unknown[]>();
  /**
   * Posición de la línea respecto del contenido: `left`, `right` o `alternate` en el layout vertical,
   * y `top`, `bottom` o `alternate` en el horizontal.
   */
  readonly align = input<IntTimelineAlign>('left');
  /** Orientación de la línea de tiempo: `vertical` u `horizontal`. */
  readonly layout = input<IntTimelineLayout>('vertical');
  /** int-* extension: muestra todo el timeline deshabilitado (marcadores, línea y textos en gris, `aria-disabled`). */
  readonly disabled = input(false, { transform: booleanAttribute });

  // Templates by reference, same names as PrimeNG (direct children only, like p-timeline).
  /** Contenido de cada evento; recibe el evento como `$implicit`. */
  protected readonly contentTemplate = contentChild<TemplateRef<IntTimelineTemplateContext>>(
    'content',
    { descendants: false },
  );
  /**
   * Contenido del lado opuesto de la línea (p. ej. la fecha); recibe el evento como `$implicit`.
   * Sin este template la columna no ocupa espacio, salvo con `align="alternate"`, donde centra la línea.
   */
  protected readonly oppositeTemplate = contentChild<TemplateRef<IntTimelineTemplateContext>>(
    'opposite',
    { descendants: false },
  );
  /** Marcador personalizado de cada evento (p. ej. un icono); recibe el evento como `$implicit`. */
  protected readonly markerTemplate = contentChild<TemplateRef<IntTimelineTemplateContext>>(
    'marker',
    { descendants: false },
  );

  /**
   * int-* extension: PrimeNG always renders the opposite column, which takes half the row even when empty.
   * Here it only renders with the #opposite template, or in alternate, where it keeps the line centered.
   */
  protected readonly showOpposite = computed(
    () => !!this.oppositeTemplate() || this.align() === 'alternate',
  );
}
