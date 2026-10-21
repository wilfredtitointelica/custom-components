import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main id="main-content" class="pane" tabindex="-1">
      <section class="not-found">
        <p class="code">404</p>
        <h1>Page not found</h1>
        <p>The page or component you are looking for does not exist or has moved.</p>
        <a routerLink="/components" class="back">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Go to Components
        </a>
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
    .not-found {
      max-width: 480px;
      text-align: center;
    }
    .code {
      margin: 0;
      color: var(--c-accent);
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
      color: var(--c-ink-muted);
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      margin-top: 16px;
      padding: 0 24px;
      border-radius: 999px;
      background: var(--c-primary);
      color: var(--c-on-primary);
      font-weight: 500;
      text-decoration: none;
    }
  `,
})
export class NotFound {}
