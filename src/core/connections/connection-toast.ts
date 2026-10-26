import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

import { ExternalResources } from '../../service/external-resources';

/**
 * Floating notices of the external connections (lost, restored, not available). Each closes itself after 10 s;
 * it fades in and out moving slightly up (animate.enter / animate.leave).
 */
@Component({
  selector: 'app-connection-toast',
  template: `
    <div #stack class="doc-toast-stack" popover="manual" role="status" aria-live="polite">
      @for (notice of connections.notices(); track notice.id) {
        <div
          class="doc-toast"
          [class]="'doc-is-' + notice.tone"
          animate.enter="doc-toast-enter"
          animate.leave="doc-toast-leave"
        >
          <i
            class="pi"
            [class.pi-check-circle]="notice.tone === 'success'"
            [class.pi-exclamation-triangle]="notice.tone === 'danger'"
            aria-hidden="true"
          ></i>
          <div class="doc-toast-text">
            <strong class="doc-toast-title">{{ notice.title }}</strong>
            <span class="doc-toast-message">
              {{ notice.message }}
              @if (notice.url) {
                <span class="doc-toast-url"><strong>{{ notice.url }}</strong>{{ notice.suffix }}</span>
              }
            </span>
          </div>
          <button type="button" class="doc-toast-close" aria-label="Cerrar aviso" (click)="connections.dismiss(notice.id)">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './connection-toast.scss',
})
export class ConnectionToast {
  protected readonly connections = inject(ExternalResources);
  private readonly stack = viewChild.required<ElementRef<HTMLElement>>('stack');

  /**
   * The stack is a manual popover, always shown, so it lives in the top layer: above any z-index and above
   * popovers / modal dialogs (last-copies panel, Style Guide). Whatever opens later in the top layer would
   * cover it, so it is shown again right after, back on top.
   */
  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const stack = this.stack().nativeElement;
      stack.showPopover();
      const raise = (event: Event) => {
        if (event.target !== stack && (event as ToggleEvent).newState === 'open') {
          stack.hidePopover();
          stack.showPopover();
        }
      };
      // toggle does not bubble: listened in the capture phase.
      document.addEventListener('toggle', raise, true);
      destroyRef.onDestroy(() => document.removeEventListener('toggle', raise, true));
    });
  }
}
