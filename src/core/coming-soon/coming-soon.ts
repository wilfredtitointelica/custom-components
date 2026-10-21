import { Component, input } from '@angular/core';

/** Initial structure for sections that are not available yet. */
@Component({
  selector: 'app-coming-soon',
  template: `
    <section class="coming-soon" [attr.aria-labelledby]="'coming-soon-title'">
      <span class="badge">Coming soon</span>
      <h1 id="coming-soon-title">{{ title() }}</h1>
      <p>{{ description() }}</p>
      <ng-content />
    </section>
  `,
  styles: `
    :host {
      display: block;
      max-width: var(--layout-max);
      margin: 0 auto;
      padding: 48px var(--gutter);
    }
    .coming-soon {
      padding: 56px 32px;
      border: 1px dashed var(--c-border-strong);
      border-radius: var(--radius-lg);
      background: var(--c-surface);
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--c-accent-soft);
      color: var(--c-accent-text);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h1 {
      margin: 16px 0 8px;
      font-size: 1.75rem;
      font-weight: 600;
    }
    p {
      max-width: 52ch;
      margin: 0 auto;
      color: var(--c-ink-muted);
    }
  `,
})
export class ComingSoon {
  readonly title = input.required<string>();
  readonly description = input('This section is being prepared and will be available in a future release.');
}
