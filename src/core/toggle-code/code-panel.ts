import { Component, computed, input, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

import { CODE_LANGUAGES, CodeLanguage, DocExampleCode } from '../../service/catalog.model';

/**
 * Code viewer shown under a variant when its Code switch is on.
 * Shows the real source of the example folder (example.html / example.ts); nothing is invented here.
 */
@Component({
  selector: 'app-code-panel',
  imports: [UpperCasePipe],
  template: `
    <div class="code-panel" role="region" [attr.aria-label]="'Code: ' + label()">
      <div class="code-toolbar">
        <div class="code-tabs" role="tablist" aria-label="Language">
          @for (language of languages; track language) {
            <button
              type="button"
              role="tab"
              class="code-tab"
              [class.is-selected]="language === selected()"
              [attr.aria-selected]="language === selected()"
              (click)="selected.set(language)"
            >
              {{ language | uppercase }}
            </button>
          }
        </div>
        <button
          type="button"
          class="code-copy"
          [disabled]="!current()"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
          (click)="copy()"
        >
          <i
            class="pi"
            [class.pi-copy]="!copied()"
            [class.pi-check]="copied()"
            aria-hidden="true"
          ></i>
        </button>
      </div>
      <div class="code-body" role="tabpanel">
        @if (current(); as source) {
          <pre><code>{{ source }}</code></pre>
        } @else {
          <p class="code-pending">
            {{ selected() | uppercase }} code not available yet. It will be published once this
            variant has its example folder.
          </p>
        }
      </div>
    </div>
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

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.current() ?? '');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
