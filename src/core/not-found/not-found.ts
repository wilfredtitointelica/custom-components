import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main id="main-content" class="doc-pane" tabindex="-1">
      <section class="doc-not-found">
        <p class="doc-code">404</p>
        <h1>Page not found</h1>
        <p>The page or component you are looking for does not exist or has moved.</p>
        <a routerLink="/components" class="doc-back">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Go to Components
        </a>
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
    .doc-not-found {
      max-width: 480px;
      text-align: center;
    }
    .doc-code {
      margin: 0;
      color: var(--doc-accent);
      font-size: clamp(4rem, 3rem + 4vw, 6rem);
      font-weight: 300;
      line-height: 1;
    }
    h1 {
      margin: 8px 0;
      font-size: 1.75rem;
      font-weight: 400;
    }
    p {
      color: var(--doc-ink-muted);
    }
    .doc-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      margin-top: 16px;
      padding: 0 24px;
      border-radius: 999px;
      background: var(--doc-primary);
      color: var(--doc-on-primary);
      font-weight: 500;
      text-decoration: none;
    }
  `,
})
export class NotFound {}
