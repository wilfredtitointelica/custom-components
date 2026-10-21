import { Component, input } from "@angular/core";

/** Initial structure for sections that are not available yet. */
@Component({
	selector: "app-coming-soon",
	template: `
		<main id="main-content" class="doc-pane" tabindex="-1">
			<section class="doc-coming-soon" aria-labelledby="coming-soon-title">
				@if (icon()) {
				<span class="doc-icon"><i class="pi {{ icon() }}" aria-hidden="true"></i></span>
				}
				<span class="doc-badge">Coming soon</span>
				<h1 id="coming-soon-title">{{ title() }}</h1>
				<p>{{ description() }}</p>
				<ng-content />
			</section>
		</main>
	`,
	styles: `
    :host {
      display: block;
      padding: var(--doc-pane-gap);
    }
    .doc-pane {
      display: grid;
      place-items: center;
      min-height: calc(100dvh - var(--doc-pane-gap) * 2 - var(--doc-bottombar-h));
      padding: 48px 24px;
      border-radius: var(--doc-radius-xl);
      background: var(--doc-surface);
      outline: none;
    }
    .doc-coming-soon {
      display: grid;
      justify-items: center;
      max-width: 600px;
      text-align: center;
    }
    .doc-icon {
      display: grid;
      place-items: center;
      width: 96px;
      height: 96px;
      margin-bottom: 24px;
      border-radius: var(--doc-radius-xl);
      background: var(--doc-primary-container);
      color: var(--doc-on-primary-container);
    }
    .doc-icon .pi {
      font-size: 2.25rem;
    }
    .doc-badge {
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--doc-accent-container);
      color: var(--doc-on-accent-container);
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
      color: var(--doc-ink-muted);
      font-size: 1rem;
    }
  `,
})
export class ComingSoon {
	readonly title = input.required<string>();
	readonly icon = input<string>();
	readonly description = input("This section is being prepared and will be available in a future release.");
}
