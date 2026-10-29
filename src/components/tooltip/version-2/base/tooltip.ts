import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { IntPlacement, uniqueId } from '../../../_shared_';

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

/** Arrow inset from the bubble edge (12px, `space/150`) plus half the arrow width (4px). */
const CORNER_SHIFT = 16;

const POSITIONS: Record<IntTooltipPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
  'top-left': { originX: 'center', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetX: -CORNER_SHIFT },
  'top-right': { originX: 'center', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: CORNER_SHIFT },
  'bottom-left': { originX: 'center', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetX: -CORNER_SHIFT },
  'bottom-right': { originX: 'center', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: CORNER_SHIFT },
};

const OPPOSITE: Record<IntTooltipPosition, IntTooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  'top-left': 'bottom-left',
  'top-right': 'bottom-right',
  'bottom-left': 'top-left',
  'bottom-right': 'top-right',
};

/**
 * <int-tooltip>: the floating bubble rendered in the CDK overlay (BEM block `int-tooltip`).
 * Internal — use the `intTooltip` directive.
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
  readonly id = input.required<string>();
  readonly content = input<IntTooltipContent>(null);
  readonly title = input<string | undefined>(undefined);
  /** Side actually used after the overlay flips; drives the arrow side. */
  readonly position = input<IntTooltipPosition>('top');
  readonly arrow = input(true);
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

/**
 * [intTooltip] · version 2. Shows a tooltip on hover and keyboard focus (`tooltipEvent`), linked with
 * aria-describedby; Escape hides it. API mirrors PrimeNG v20 pTooltip.
 * Version 2 follows Figma "Atoms / Tooltip": arrow pointing at the host, corner positions and a title.
 * Deviations: `tooltipPosition` adds `top-left`, `top-right`, `bottom-left`, `bottom-right`;
 * `tooltipArrow` and `tooltipTitle` are int-* extensions (PrimeNG has neither).
 *
 * @example
 * <button intButton icon="icon icon-download" intTooltip="Export" tooltipPosition="top"></button>
 * <span intTooltip="0.80% + USD 0.10" tooltipTitle="Rate" tooltipPosition="bottom-left">...</span>
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
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly content = input<IntTooltipContent>(null, { alias: 'intTooltip' });
  readonly tooltipPosition = input<IntTooltipPosition>('top');
  /** `both` (default) shows on hover and keyboard focus for accessibility. */
  readonly tooltipEvent = input<'hover' | 'focus' | 'both'>('both');
  readonly showDelay = input(0, { transform: numberAttribute });
  readonly hideDelay = input(0, { transform: numberAttribute });
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });
  readonly tooltipStyleClass = input<string | undefined>(undefined);
  /** int-* extension: bold title above the content (Figma "Title here"). */
  readonly tooltipTitle = input<string | undefined>(undefined);
  /** int-* extension: `false` hides the arrow (Figma `Indicator=None`); the gap stays the same. */
  readonly tooltipArrow = input(true, { transform: booleanAttribute });

  protected readonly id = uniqueId('int-tooltip');
  protected readonly visible = signal(false);

  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private overlayRef: OverlayRef | null = null;
  private panel: ComponentRef<IntTooltipPanel> | null = null;
  private positionChanges: Subscription | null = null;
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
    const preferred = this.tooltipPosition();
    const candidates = [preferred, OPPOSITE[preferred]];
    if (!this.overlayRef) {
      const strategy = this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions(candidates.map((position) => POSITIONS[position]))
        .withPush(false)
        .withViewportMargin(8);
      this.overlayRef = this.overlay.create({
        positionStrategy: strategy,
        scrollStrategy: this.overlay.scrollStrategies.close(),
      });
      // Point the arrow at the host on whichever side the overlay ended up.
      this.positionChanges = strategy.positionChanges.subscribe(({ connectionPair: pair }) => {
        const used = candidates.find((position) => {
          const p = POSITIONS[position];
          return (
            p.originX === pair.originX &&
            p.originY === pair.originY &&
            p.overlayX === pair.overlayX &&
            p.overlayY === pair.overlayY
          );
        });
        if (used) this.panel?.setInput('position', used);
      });
    }
    this.panel = this.overlayRef.attach(new ComponentPortal(IntTooltipPanel));
    this.panel.setInput('id', this.id);
    this.panel.setInput('content', this.content());
    this.panel.setInput('title', this.tooltipTitle());
    this.panel.setInput('position', preferred);
    this.panel.setInput('arrow', this.tooltipArrow());
    this.panel.setInput('styleClass', this.tooltipStyleClass());
    this.visible.set(true);
  }

  hide(): void {
    clearTimeout(this.timer);
    this.overlayRef?.detach();
    this.panel = null;
    this.visible.set(false);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.positionChanges?.unsubscribe();
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
