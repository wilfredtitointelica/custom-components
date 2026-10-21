import { Component, computed, ElementRef, input, signal, TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';

import { CODE_LANGUAGES, CodeLanguage } from '../../service/catalog.model';

/**
 * Code viewer shown under a variant when its Code switch is on.
 * Snippets are templates supplied by the component author (see DocCode); none are invented here.
 */
@Component({
  selector: 'app-code-panel',
  imports: [NgTemplateOutlet, UpperCasePipe],
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
          <i class="pi" [class.pi-copy]="!copied()" [class.pi-check]="copied()" aria-hidden="true"></i>
        </button>
      </div>
      <div #body class="code-body" role="tabpanel">
        @if (current(); as template) {
          <ng-container [ngTemplateOutlet]="template" />
        } @else {
          <p class="code-pending">
            {{ selected() | uppercase }} code not available yet. It will be published once this variant is
            implemented.
          </p>
        }
      </div>
    </div>
  `,
  styleUrl: './code-panel.scss',
})
export class CodePanel {
  readonly label = input.required<string>();
  readonly snippets = input<ReadonlyMap<CodeLanguage, TemplateRef<unknown>>>();

  protected readonly languages = CODE_LANGUAGES;
  protected readonly selected = signal<CodeLanguage>(CODE_LANGUAGES[0]);
  protected readonly current = computed(() => this.snippets()?.get(this.selected()) ?? null);
  protected readonly copied = signal(false);

  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.body().nativeElement.innerText.trim());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
