import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';

import { CODE_LANGUAGES, CodeLanguage, DocExampleCode } from '../../service/catalog.model';
import { ClipboardHistory } from '../../service/clipboard-history';

/**
 * Code viewer shown under a variant when its Code switch is on.
 * Shows the real source of the example folder (example.html / example.ts); nothing is invented here.
 * The body is limited to 480px (scroll); Expand opens the same viewer in a modal <dialog>
 * (closes with the X button, Esc or a click on the backdrop).
 */
@Component({
  selector: 'app-code-panel',
  imports: [NgTemplateOutlet, UpperCasePipe],
  template: `
    <div class="doc-code-panel" role="region" [attr.aria-label]="'Code: ' + label()">
      <ng-container *ngTemplateOutlet="toolbar; context: { $implicit: false }" />
      <ng-container *ngTemplateOutlet="body" />
    </div>

    <dialog
      #dialog
      class="doc-code-dialog"
      [attr.aria-label]="'Code: ' + label()"
      (click)="$event.target === dialog && close()"
    >
      <div class="doc-code-panel">
        <ng-container *ngTemplateOutlet="toolbar; context: { $implicit: true }" />
        <ng-container *ngTemplateOutlet="body" />
      </div>
    </dialog>

    <ng-template #toolbar let-inDialog>
      <div class="doc-code-toolbar">
        <div class="doc-code-tabs" role="tablist" aria-label="Language">
          @for (language of languages; track language) {
            <button
              type="button"
              role="tab"
              class="doc-code-tab"
              [class.doc-is-selected]="language === selected()"
              [attr.aria-selected]="language === selected()"
              (click)="selected.set(language)"
            >
              {{ language | uppercase }}
            </button>
          }
        </div>
        <div class="doc-code-actions">
          <button
            type="button"
            class="doc-code-action"
            [disabled]="!current()"
            [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
            [title]="copied() ? 'Copied' : 'Copy code'"
            (click)="copy()"
          >
            <i
              class="pi"
              [class.pi-copy]="!copied()"
              [class.pi-check]="copied()"
              aria-hidden="true"
            ></i>
          </button>
          @if (inDialog) {
            <button
              type="button"
              class="doc-code-action"
              aria-label="Close"
              title="Close"
              autofocus
              (click)="close()"
            >
              <i class="pi pi-times" aria-hidden="true"></i>
            </button>
          } @else {
            <button
              type="button"
              class="doc-code-action"
              aria-label="Expand code"
              title="Expand"
              aria-haspopup="dialog"
              (click)="expand()"
            >
              <i class="pi pi-window-maximize" aria-hidden="true"></i>
            </button>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #body>
      <div class="doc-code-body" role="tabpanel">
        @if (current(); as source) {
          <pre><code>{{ source }}</code></pre>
        } @else {
          <p class="doc-code-pending">
            {{ selected() | uppercase }} code not available yet. It will be published once this
            variant has its example folder.
          </p>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './code-panel.scss',
})
export class CodePanel {
  readonly label = input.required<string>();
  readonly sources = input<DocExampleCode>();

  protected readonly languages = CODE_LANGUAGES;
  protected readonly selected = signal<CodeLanguage>(CODE_LANGUAGES[0]);
  protected readonly current = computed(() => this.sources()?.[this.selected()] ?? null);
  protected readonly copied = signal(false);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly clipboard = inject(ClipboardHistory);

  protected async copy(): Promise<void> {
    const label = `${this.selected().toUpperCase()} · ${this.label()}`;
    if (!(await this.clipboard.copy('code', this.current() ?? '', label))) {
      return;
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  protected expand(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
