import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <p class="code">404</p>
      <h1>Page not found</h1>
      <p>The page or component you are looking for does not exist or has moved.</p>
      <a routerLink="/components" class="back">Go to Components</a>
    </section>
  `,
  styles: `
    :host {
      display: block;
      padding: 72px var(--gutter);
    }
    .not-found {
      max-width: 480px;
      margin: 0 auto;
      text-align: center;
    }
    .code {
      margin: 0;
      color: var(--c-accent-text);
      font-size: 3rem;
      font-weight: 700;
    }
    h1 {
      margin: 4px 0 8px;
      font-size: 1.5rem;
    }
    p {
      color: var(--c-ink-muted);
    }
    .back {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 20px;
      border-radius: 999px;
      background: var(--c-header);
      color: #fff;
      text-decoration: none;
    }
  `,
})
export class NotFound {}
