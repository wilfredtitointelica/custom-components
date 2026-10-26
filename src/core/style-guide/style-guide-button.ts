import { Component, computed, effect, inject, viewChild } from '@angular/core';

import { ExternalResources } from '../../service/external-resources';
import { StyleGuideDialog } from './style-guide-dialog';

/**
 * Entry point of the Style Guide dialog (top bar, after the Code switch). Only usable while the style guide
 * is connected: its tokens are read from the bundle in the page. Otherwise it stays disabled (aria-disabled,
 * so it keeps focus and hover) with a tooltip that says why.
 */
@Component({
  selector: 'app-style-guide-button',
  imports: [StyleGuideDialog],
  template: `
    <button
      type="button"
      class="doc-sg-trigger"
      aria-haspopup="dialog"
      [attr.aria-disabled]="!ready() || null"
      [attr.aria-describedby]="ready() ? null : 'doc-sg-reason'"
      (click)="ready() && dialog()?.open()"
    >
      <i class="pi pi-folder" aria-hidden="true"></i>
      <span class="doc-sg-trigger-label">STYLEGUIDES</span>
    </button>
    @if (!ready()) {
      <span id="doc-sg-reason" role="tooltip" class="doc-sg-tooltip">
        <strong>Sin conexión con el Style Guide.</strong> El repo <code>Intelica.Style.Guide.New</code> no responde en
        <code>{{ host }}</code>: levántalo con <code>npm start</code> para ver sus tokens.
      </span>
    }
    <app-style-guide-dialog />
  `,
  styleUrl: './style-guide-button.scss',
})
export class StyleGuideButton {
  protected readonly styleGuide = inject(ExternalResources).styleGuide;
  /** Server of the bundle (localhost:8080), short enough for the tooltip. */
  protected readonly host = new URL(this.styleGuide().resource.url, location.href).host;

  protected readonly ready = computed(() => this.styleGuide().status === 'connected');
  protected readonly dialog = viewChild(StyleGuideDialog);

  constructor() {
    // Connection lost: its CSS leaves the page, so the open dialog would show stale tokens.
    effect(() => !this.ready() && this.dialog()?.close());
  }
}
