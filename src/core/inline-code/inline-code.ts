import { Component, computed, input } from '@angular/core';

/** One piece of a description: plain text, or a name written between backticks. */
interface Segment {
  readonly text: string;
  readonly code: boolean;
}

/** "Card con `header` y `footer`." → text · code · text · code · text (backticks dropped). */
export function toSegments(text: string): readonly Segment[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 2
        ? { text: part.slice(1, -1), code: true }
        : { text: part, code: false },
    );
}

/**
 * A documentation description (example.html header, JSDoc of the API tab) with its `names` between
 * backticks shown as inline code, as PrimeNG writes them ("Card content can be customized with
 * `header` and `footer`"): inputs, templates, outputs, classes. The rest stays plain text.
 */
@Component({
  selector: 'app-inline-code',
  // One line on purpose: any newline or indentation here would render as a space next to the code
  // (`header` , instead of `header`,).
  // prettier-ignore
  template: `@for (segment of segments(); track $index) {@if (segment.code) {<code>{{ segment.text }}</code>} @else {<ng-container>{{ segment.text }}</ng-container>}}`,
  // Same inline code as the Skills page (skills-page.scss): one look for names across the site. The ink
  // color is fixed because descriptions use muted text, where an inherited color washes the chip out.
  styles: `
    code {
      padding: 1px 6px;
      border-radius: 6px;
      background: var(--doc-surface-high);
      color: var(--doc-ink);
      font-family: var(--doc-font-mono);
      font-size: 0.8125rem;
    }
  `,
})
export class InlineCode {
  readonly text = input('');

  protected readonly segments = computed(() => toSegments(this.text()));
}
