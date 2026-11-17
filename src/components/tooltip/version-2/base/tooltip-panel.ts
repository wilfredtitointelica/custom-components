import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { IntPlacement } from '../../../_shared_';

export type IntTooltipContent = string | TemplateRef<unknown> | null | undefined;

/**
 * Where the tooltip opens relative to the host. The corner values keep the bubble on that side
 * (`top-*` above, `bottom-*` below) and align it so its arrow, inset from the `left` / `right` edge,
 * points at the host center. Figma "Indicator" names the arrow instead: `Indicator=bottom-left ↙️`
 * is `tooltipPosition="top-left"`.
 */
export type IntTooltipPosition =
  | IntPlacement
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * <int-tooltip>: the floating bubble rendered in the CDK overlay (BEM block `int-tooltip`).
 * Internal — use the `intTooltip` directive (base/tooltip.ts).
 */
@Component({
  selector: 'int-tooltip',
  imports: [NgTemplateOutlet],
  templateUrl: './tooltip.html',
  styleUrl: '../styles/_index.scss',
  host: {
    role: 'tooltip',
    '[id]': 'id()',
    '[class]': 'hostClass()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTooltipPanel {
  /** `id` del panel, enlazado con `aria-describedby` del elemento. */
  readonly id = input.required<string>();
  /** Contenido del tooltip: texto o plantilla. */
  readonly content = input<IntTooltipContent>(null);
  /** Título en negrita sobre el contenido. */
  readonly title = input<string | undefined>(undefined);
  /** Lado que quedó en uso después de acomodarse; define de qué lado va la flecha. */
  readonly position = input<IntTooltipPosition>('top');
  /** Muestra la flecha. */
  readonly arrow = input(true);
  /** Clases extra del panel. */
  readonly styleClass = input<string | undefined>(undefined);

  protected readonly template = computed(() => {
    const c = this.content();
    return c instanceof TemplateRef ? c : null;
  });

  /** int-tooltip int-tooltip--<position> [int-tooltip--no-arrow] [styleClass]. */
  protected readonly hostClass = computed(() =>
    [
      'int-tooltip',
      `int-tooltip--${this.position()}`,
      this.arrow() ? '' : 'int-tooltip--no-arrow',
      this.styleClass() ?? '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
