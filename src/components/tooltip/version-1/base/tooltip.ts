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
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly content = input<IntTooltipContent>(null, { alias: 'intTooltip' });
  readonly tooltipPosition = input<IntPlacement>('top');
  /** `both` (default) shows on hover and keyboard focus for accessibility. */
  readonly tooltipEvent = input<'hover' | 'focus' | 'both'>('both');
  readonly showDelay = input(0, { transform: numberAttribute });
  readonly hideDelay = input(0, { transform: numberAttribute });
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });
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
