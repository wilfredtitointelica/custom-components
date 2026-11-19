import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';

import { IntPlacement, placementPositions, uniqueId } from '../../../_shared_';
import { IntTooltipContent, IntTooltipPanel } from './tooltip-panel';

export type { IntTooltipContent } from './tooltip-panel';

/**
 * [intTooltip] · version 1. Shows a tooltip on hover and keyboard focus (`tooltipEvent`), linked with
 * aria-describedby; Escape hides it. API mirrors PrimeNG v20 pTooltip.
 *
 * @example
 * <button intButton icon="icon icon-download" intTooltip="Export" tooltipPosition="top"></button>
 * <span [intTooltip]="richTpl">...</span>
 */
@Directive({
  selector: '[intTooltip]',
  host: {
    // Marks the element it is applied to, so the documentation Scan finds it (no class of its own).
    'data-int-tooltip': '',
    '(mouseenter)': 'trigger("hover", true)',
    '(mouseleave)': 'trigger("hover", false)',
    '(focusin)': 'trigger("focus", true)',
    '(focusout)': 'trigger("focus", false)',
    '(keydown.escape)': 'hide()',
    '[attr.aria-describedby]': 'visible() ? id : null',
  },
})
export class IntTooltip implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Contenido del tooltip: texto o una plantilla. Vacío, no se muestra. */
  readonly content = input<IntTooltipContent>(null, { alias: 'intTooltip' });
  /** Lado preferido respecto al elemento; cambia al opuesto si no hay espacio. */
  readonly tooltipPosition = input<IntPlacement>('top');
  /** Qué lo muestra: `hover`, `focus` o `both` (por defecto: mouse y foco del teclado, por accesibilidad). */
  readonly tooltipEvent = input<'hover' | 'focus' | 'both'>('both');
  /** Milisegundos de espera antes de mostrarse. */
  readonly showDelay = input(0, { transform: numberAttribute });
  /** Milisegundos de espera antes de ocultarse. */
  readonly hideDelay = input(0, { transform: numberAttribute });
  /** Desactiva el tooltip. */
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });
  /** Clases extra para el panel del tooltip. */
  readonly tooltipStyleClass = input<string | undefined>(undefined);

  protected readonly id = uniqueId('int-tooltip');
  protected readonly visible = signal(false);

  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private overlayRef: OverlayRef | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Hide when disabled or emptied while visible.
    effect(() => {
      if ((this.tooltipDisabled() || !this.content()) && this.visible()) this.hide();
    });
  }

  protected trigger(event: 'hover' | 'focus', show: boolean): void {
    const mode = this.tooltipEvent();
    if (mode !== 'both' && mode !== event) return;
    if (show) this.scheduleShow();
    else this.scheduleHide();
  }

  /** Muestra el tooltip de inmediato. */
  show(): void {
    if (this.tooltipDisabled() || !this.content() || this.visible()) return;
    this.overlayRef ??= this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions(placementPositions(this.tooltipPosition()))
        .withPush(true)
        .withViewportMargin(8),
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    const ref = this.overlayRef.attach(new ComponentPortal(IntTooltipPanel));
    ref.setInput('id', this.id);
    ref.setInput('content', this.content());
    ref.setInput('styleClass', this.tooltipStyleClass());
    this.visible.set(true);
  }

  /** Oculta el tooltip de inmediato. */
  hide(): void {
    clearTimeout(this.timer);
    this.overlayRef?.detach();
    this.visible.set(false);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.overlayRef?.dispose();
  }

  private scheduleShow(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), this.showDelay());
  }

  private scheduleHide(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), this.hideDelay());
  }
}
