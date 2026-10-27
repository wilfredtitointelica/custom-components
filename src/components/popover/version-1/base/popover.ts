import { FocusMonitor } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
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

import { INT_DROPDOWN_POSITIONS, uniqueId } from '../../../_shared_';

/**
 * <int-popover> · version 1. Floating container anchored to a trigger, opened programmatically with
 * toggle / show / hide; API mirrors PrimeNG v20 Popover. The host is `display: contents`: the
 * `int-popover` block is the panel inside the CDK overlay.
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

  readonly onShow = output<void>();
  readonly onHide = output<void>();

  readonly visible = signal(false);
  protected readonly id = uniqueId('int-popover');

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private overlayRef: OverlayRef | null = null;
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

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(anchor)
        .withPositions(INT_DROPDOWN_POSITIONS)
        .withPush(true)
        .withViewportMargin(8),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
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
    this.overlayRef?.dispose();
  }
}
