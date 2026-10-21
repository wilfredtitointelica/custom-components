import { Component, input } from '@angular/core';

/** Initial structure for sections that are not available yet. */
@Component({
  selector: 'app-coming-soon',
  template: `
    <main id="main-content" class="pane" tabindex="-1">
      <section class="coming-soon" aria-labelledby="coming-soon-title">
        @if (icon()) {
          <span class="icon"><i class="pi {{ icon() }}" aria-hidden="true"></i></span>
        }
        <span class="badge">Coming soon</span>
        <h1 id="coming-soon-title">{{ title() }}</h1>
        <p>{{ description() }}</p>
        <ng-content />
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--pane-gap);
    }
    .pane {
      display: grid;
      place-items: center;
      min-height: calc(100dvh - var(--pane-gap) * 2 - var(--bottombar-h));
      padding: 48px 24px;
      border-radius: var(--radius-xl);
      background: var(--c-surface);
      outline: none;
    }
    .coming-soon {
      display: grid;
      justify-items: center;
      max-width: 560px;
      text-align: center;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 96px;
      height: 96px;
      margin-bottom: 24px;
      border-radius: var(--radius-xl);
      background: var(--c-primary-container);
      color: var(--c-on-primary-container);
    }
    .icon .pi {
      font-size: 2.25rem;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--c-accent-container);
      color: var(--c-on-accent-container);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 16px 0 12px;
      font-size: clamp(2rem, 1.5rem + 2vw, 2.8125rem);
      font-weight: 400;
      line-height: 1.15;
    }
    p {
      margin: 0;
      color: var(--c-ink-muted);
      font-size: 1rem;
    }
  `,
})
export class ComingSoon {
  readonly title = input.required<string>();
  readonly icon = input<string>();
  readonly description = input('This section is being prepared and will be available in a future release.');
}
