import { FocusMonitor } from '@angular/cdk/a11y';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { INT_DROPDOWN_POSITIONS, uniqueId } from '../../../_shared_';

/** Same pairs as INT_DROPDOWN_POSITIONS, 4px further away to leave room for the 8×4 beak. */
const ARROW_POSITIONS: ConnectedPosition[] = INT_DROPDOWN_POSITIONS.map((p) => ({
  ...p,
  offsetY: (p.offsetY ?? 0) * 2,
}));

/** Closest the beak center gets to the panel edge: 12px inset (`space/150`) plus half the beak (4px). */
const ARROW_EDGE = 16;

/**
 * <int-popover> · version 1. Floating container anchored to a trigger, opened programmatically with
 * toggle / show / hide; API mirrors PrimeNG v20 Popover. The host is `display: contents`: the
 * `int-popover` block is the panel inside the CDK overlay.
 * Deviation: the arrow is opt-in (`arrow`) and looks like the tooltip beak; PrimeNG always draws one.
 *
 * @example
 * <button intButton label="Columns" (click)="op.toggle($event)"></button>
 * <int-popover #op ariaLabel="Column options">...</int-popover>
 */
@Component({
  selector: 'int-popover',
  templateUrl: './popover.html',
  styleUrl: '../styles/_index.scss',
  host: { style: 'display: contents' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntPopover implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Close on outside click. */
  readonly dismissable = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Moves focus into the panel when shown and restores it to the trigger when hidden. */
  readonly focusOnShow = input(true, { transform: booleanAttribute });
  readonly styleClass = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  /**
   * int-* extension: flecha sólida (como la del tooltip) que apunta al centro del disparador; pasa al
   * borde inferior cuando el popover se abre encima.
   */
  readonly arrow = input(false, { transform: booleanAttribute });

  readonly onShow = output<void>();
  readonly onHide = output<void>();

  readonly visible = signal(false);
  protected readonly id = uniqueId('int-popover');
  /** The panel opened above the trigger: the beak goes on the bottom edge. */
  protected readonly flipped = signal(false);
  /** Beak center from the panel's left edge, in px. */
  protected readonly arrowLeft = signal(ARROW_EDGE);

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private overlayRef: OverlayRef | null = null;
  private positionChanges: Subscription | null = null;
  private target: HTMLElement | null = null;

  toggle(event: Event, target?: HTMLElement): void {
    if (this.visible()) this.hide();
    else this.show(event, target);
  }

  show(event: Event | null, target?: HTMLElement): void {
    const anchor = target ?? (event?.currentTarget as HTMLElement | null) ?? null;
    if (!anchor) return;
    if (this.visible()) this.hide(false);
    this.target = anchor;

    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(anchor)
      .withPositions(this.arrow() ? ARROW_POSITIONS : INT_DROPDOWN_POSITIONS)
      // No push: pushing it into the viewport detaches the panel from the trigger when the page scrolls.
      .withPush(false)
      .withViewportMargin(8);
    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    if (this.arrow()) {
      // Emitted after the CDK applied the position (push included), so the rects are final.
      this.positionChanges = strategy.positionChanges.subscribe(({ connectionPair }) => {
        this.flipped.set(connectionPair.originY === 'top');
        this.updateArrow(anchor);
      });
    }
    this.overlayRef.attach(new TemplatePortal(this.panel(), this.vcr));
    anchor.setAttribute('aria-expanded', 'true');
    anchor.setAttribute('aria-controls', this.id);

    this.overlayRef.outsidePointerEvents().subscribe((e) => {
      if (this.dismissable() && !anchor.contains(e.target as Node)) this.hide(false);
    });
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape' && this.closeOnEscape()) {
        e.preventDefault();
        this.hide();
      }
    });

    this.visible.set(true);
    if (this.focusOnShow()) {
      queueMicrotask(() => this.overlayRef?.overlayElement.querySelector<HTMLElement>('.int-popover')?.focus());
    }
    this.onShow.emit();
  }

  /** @param restoreFocus return focus to the trigger (default true). */
  hide(restoreFocus = true): void {
    if (!this.overlayRef) return;
    this.positionChanges?.unsubscribe();
    this.positionChanges = null;
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.target?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && this.focusOnShow() && this.target) {
      this.focusMonitor.focusVia(this.target, 'keyboard');
    }
    this.visible.set(false);
    this.onHide.emit();
  }

  /** Recomputes the position, e.g. after the content size changed. */
  align(): void {
    this.overlayRef?.updatePosition();
  }

  ngOnDestroy(): void {
    this.positionChanges?.unsubscribe();
    this.overlayRef?.dispose();
  }

  /** Points the beak at the trigger center, kept clear of the rounded corners. */
  private updateArrow(anchor: HTMLElement): void {
    const panel = this.overlayRef?.overlayElement.querySelector<HTMLElement>('.int-popover');
    if (!panel) return;
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const center = a.left + a.width / 2 - p.left;
    this.arrowLeft.set(Math.round(Math.min(Math.max(center, ARROW_EDGE), Math.max(p.width - ARROW_EDGE, ARROW_EDGE))));
  }
}
