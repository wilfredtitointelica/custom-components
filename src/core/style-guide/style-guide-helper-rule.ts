import { Component, computed, input, output } from '@angular/core';

import { HelperRule } from './style-guide-helpers';

/**
 * One helper block of the Style Guide dialog, drawn as its CSS: the selector with its classes, the content of
 * the braces faded, with !important in red and a swatch next to color values. A click anywhere on the block
 * copies the name of its first class (never the code); a click on a class of a group or on a nested `&--x`
 * copies that one, and turns green. A copy icon (on hover) and then "Copiado" show in the top right corner,
 * or, with `namesOnly` (just the class names: no dot, no braces), next to each name like the token rows.
 */
@Component({
  selector: 'app-style-guide-helper-rule',
  template: `
    <div
      class="doc-sg-rule"
      role="button"
      tabindex="0"
      [class.doc-is-copied]="hasCopied()"
      [title]="'Copiar ' + primary()"
      (click)="copyClass.emit(primary())"
      (keydown.enter)="copyClass.emit(primary())"
      (keydown.space)="$event.preventDefault(); copyClass.emit(primary())"
    >
      @if (namesOnly()) {
        <!-- Like the token rows: copy icon (on hover) or "Copiado" next to each name. -->
        @for (name of rule().classes; track name) {
          <div class="doc-sg-rule-line doc-sg-rule-name">
            <span
              class="doc-sg-rule-class"
              [class.doc-is-copied]="copied() === name"
              [title]="'Copiar ' + name"
              (click)="$event.stopPropagation(); copyClass.emit(name)"
              >{{ name }}</span
            >
            @if (copied() === name) {
              <span class="doc-sg-rule-copied" role="status"><i class="pi pi-check" aria-hidden="true"></i>Copiado</span>
            } @else {
              <i class="pi pi-copy doc-sg-rule-copy" aria-hidden="true"></i>
            }
          </div>
        }
      } @else {
        <!-- Top right corner: copy icon (on hover), "Copiado" once copied. -->
        <span class="doc-sg-rule-corner">
          @if (hasCopied()) {
            <span class="doc-sg-rule-copied" role="status"><i class="pi pi-check" aria-hidden="true"></i>Copiado</span>
          } @else {
            <i class="pi pi-copy doc-sg-rule-copy" aria-hidden="true"></i>
          }
        </span>
        @for (line of rule().lines; track $index) {
          <div class="doc-sg-rule-line" [class.doc-sg-rule-inner]="line.depth > 0" [style.--doc-sg-depth]="line.depth">
            @for (part of line.parts; track $index) {
              @switch (part.kind) {
                @case ('class') {
                  <span
                    class="doc-sg-rule-class"
                    [class.doc-is-copied]="copied() === part.name"
                    [title]="'Copiar ' + part.name"
                    (click)="$event.stopPropagation(); copyClass.emit(part.name)"
                    >{{ part.text }}</span
                  >
                }
                @case ('important') {
                  <span class="doc-sg-rule-important">!important</span>
                }
                @case ('swatch') {
                  <span class="doc-sg-rule-swatch" [style.background]="part.color" aria-hidden="true"></span>
                }
                @default {
                  <span>{{ part.text }}</span>
                }
              }
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: './style-guide-helper-rule.scss',
})
export class StyleGuideHelperRule {
  readonly rule = input.required<HelperRule>();
  /** Token or class name copied a moment ago (shared by the whole dialog). */
  readonly copied = input<string | null>(null);
  readonly namesOnly = input(false);
  /** Class name to copy, without the dot. */
  readonly copyClass = output<string>();

  /** Class copied by a click on the block itself. */
  protected readonly primary = computed(() => this.rule().classes[0] ?? '');
  protected readonly hasCopied = computed(() => {
    const copied = this.copied();
    return !!copied && this.rule().classes.includes(copied);
  });
}
