import { Component, input, output } from '@angular/core';

import { StyleToken } from './style-guide-tokens';

/**
 * Tokens of one file in the Style Guide dialog: name (a click on the cell copies `var(--name)`) and value,
 * with a swatch for colors, the value :root resolves to and the trailing comment of the source.
 * Texts rest faded and the row under the cursor lights up.
 */
@Component({
  selector: 'app-style-guide-token-table',
  template: `
    <table class="doc-sg-table">
      <tbody>
        @for (token of tokens(); track token.name) {
          <tr>
            <td class="doc-sg-name">
              <button
                type="button"
                class="doc-sg-copy"
                [class.doc-is-copied]="copied() === token.name"
                [title]="copied() === token.name ? 'Copiado' : 'Copiar var(' + token.name + ')'"
                (click)="copyToken.emit(token)"
              >
                {{ token.name }}
                @if (copied() === token.name) {
                  <span class="doc-sg-copied" role="status"><i class="pi pi-check" aria-hidden="true"></i>Copiado</span>
                } @else {
                  <i class="pi pi-copy" aria-hidden="true"></i>
                }
              </button>
            </td>
            <td class="doc-sg-value">
              @if (token.color) {
                <span class="doc-sg-swatch" [style.background]="token.resolved" aria-hidden="true"></span>
              }
              <span>{{ token.value }}</span>
              @if (token.resolved && token.resolved.toLowerCase() !== token.value.toLowerCase()) {
                <span class="doc-sg-resolved">→ {{ token.resolved }}</span>
              }
              @if (token.note) {
                <span class="doc-sg-note">// {{ token.note }}</span>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styleUrl: './style-guide-token-table.scss',
})
export class StyleGuideTokenTable {
  readonly tokens = input.required<readonly StyleToken[]>();
  /** Token or class name copied a moment ago (shared by the whole dialog). */
  readonly copied = input<string | null>(null);
  readonly copyToken = output<StyleToken>();
}
