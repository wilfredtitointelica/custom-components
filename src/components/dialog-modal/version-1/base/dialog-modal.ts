import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  booleanAttribute,
  contentChild,
  afterRenderEffect,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';

import { IntConfig, IntIcon, uniqueId } from '../../../_shared_';

/**
 * <int-dialog-modal> · version 1. Modal window rendered in a CDK overlay (focus trap, Escape, scroll lock);
 * API mirrors PrimeNG v20 Dialog (ported from @intelica/ui `int-dialog`). The host is
 * `display: contents`: the `int-dialog-modal` block is the panel inside the overlay.
 *
 * @example
 * <int-dialog-modal header="Set alert" [(visible)]="showAlert" [style]="{ width: '32rem' }">
 *   <p>Content</p>
 *   <ng-template #footer>
 *     <button intButton severity="secondary" label="Cancel" (click)="showAlert = false"></button>
 *     <button intButton label="Save" (click)="save()"></button>
 *   </ng-template>
 * </int-dialog-modal>
 */
@Component({
  selector: 'int-dialog-modal',
  imports: [CdkTrapFocus, NgStyle, NgTemplateOutlet, IntIcon],
  templateUrl: './dialog-modal.html',
  styleUrl: '../styles/_index.scss',
  host: { style: 'display: contents' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntDialogModal implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly visible = model(false);
  readonly header = input<string | undefined>(undefined);
  readonly modal = input(true, { transform: booleanAttribute });
  readonly closable = input(true, { transform: booleanAttribute });
  /** Close when clicking the mask (modal only). */
  readonly dismissableMask = input(false, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly blockScroll = input(true, { transform: booleanAttribute });
  /** Focus the first focusable element when shown; focus is restored to the opener on hide. */
  readonly focusOnShow = input(true, { transform: booleanAttribute });
  readonly position = input<'center' | 'top'>('center');
  /** Inline styles of the dialog panel, e.g. `{ width: '40rem' }` (PrimeNG `[style]`). */
  readonly style = input<Record<string, string> | null>(null);
  readonly styleClass = input<string | undefined>(undefined);

  readonly onShow = output<void>();
  readonly onHide = output<void>();

  protected readonly config = inject(IntConfig);
  protected readonly headerId = uniqueId('int-dialog-modal-title');
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  private readonly dialogTemplate = viewChild.required<TemplateRef<unknown>>('dialog');

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  constructor() {
    afterRenderEffect(() => {
      const visible = this.visible();
      untracked(() => (visible ? this.attach() : this.detach()));
    });
  }

  close(): void {
    this.visible.set(false);
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  private attach(): void {
    if (this.overlayRef) return;
    const position = this.overlay.position().global().centerHorizontally();
    if (this.position() === 'top') position.top('2rem');
    else position.centerVertically();

    this.overlayRef = this.overlay.create({
      positionStrategy: position,
      hasBackdrop: this.modal(),
      backdropClass: 'int-dialog-modal__mask',
      panelClass: 'int-dialog-modal__pane',
      scrollStrategy: this.blockScroll()
        ? this.overlay.scrollStrategies.block()
        : this.overlay.scrollStrategies.noop(),
    });
    this.overlayRef.attach(new TemplatePortal(this.dialogTemplate(), this.vcr));
    this.overlayRef.backdropClick().subscribe(() => {
      if (this.dismissableMask()) this.close();
    });
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
        event.preventDefault();
        this.close();
      }
    });
    this.onShow.emit();
  }

  private detach(): void {
    if (!this.overlayRef) return;
    // Disposing destroys the view; CdkTrapFocus restores focus to the previously focused element.
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.onHide.emit();
  }
}
