import { Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';

import { CODE_LANGUAGES, CodeLanguage, DocExampleCode } from '../../service/catalog.model';
import { ClipCodeSource, ClipboardHistory } from '../../service/clipboard-history';
import { CodeVisibility } from '../../service/code-visibility';

type CodePartKind = 'int' | 'ng' | 'dep';

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
        @if (current()) {
          <pre><code>@for (part of parts(); track $index) {<span [class]="part.kind ? 'doc-code-' + part.kind : ''" [class.doc-code-name]="part.name">{{ part.text }}</span>}</code></pre>
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
  /** Variant shown (page, #fragment, version): saved with every copy so the history can link back. */
  readonly source = input<Omit<ClipCodeSource, 'language'>>();

  protected readonly languages = CODE_LANGUAGES;
  protected readonly selected = signal<CodeLanguage>(CODE_LANGUAGES[0]);
  protected readonly current = computed(() => this.sources()?.[this.selected()] ?? null);
  /**
   * Source split so some pieces of the HTML tab stand out (text only, no innerHTML):
   * <int-*> tags, <ng-*> tags and the "dep:" comments that wrap a provisional.
   */
  protected readonly parts = computed(() => {
    const source = this.current() ?? '';
    if (this.selected() !== 'html') {
      return [{ text: source, kind: null, name: false }];
    }
    const parts: { text: string; kind: CodePartKind | null; name: boolean }[] = [];
    let last = 0;
    for (const match of source.matchAll(/<!--\s*\/?dep:[\s\S]*?-->|(<\/?)((int|ng)-[\w-]+)([^>]*>)/g)) {
      parts.push({ text: source.slice(last, match.index), kind: null, name: false });
      const [comment, open, name, prefix, rest] = match;
      if (name) {
        const kind = prefix === 'int' ? 'int' : 'ng';
        parts.push({ text: open, kind, name: false }, { text: name, kind, name: true }, { text: rest, kind, name: false });
      } else {
        parts.push({ text: comment, kind: 'dep', name: false });
      }
      last = match.index + match[0].length;
    }
    parts.push({ text: source.slice(last), kind: null, name: false });
    return parts.filter((part) => part.text);
  });
  protected readonly copied = signal(false);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly clipboard = inject(ClipboardHistory);

  constructor() {
    // Link of the history: switch to the tab the code was copied from (once).
    const code = inject(CodeVisibility);
    effect(() => {
      const requested = code.requested();
      if (requested && requested.variantId === this.source()?.variantId) {
        this.selected.set(requested.language);
        untracked(() => code.requested.set(null));
      }
    });
  }

  protected async copy(): Promise<void> {
    const label = `${this.selected().toUpperCase()} · ${this.label()}`;
    const from = this.source();
    const source = from && { ...from, language: this.selected() };
    if (!(await this.clipboard.copy('code', this.current() ?? '', label, source))) {
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
