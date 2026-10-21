import { Routes } from '@angular/router';

/**
 * Internal routes of "Card", mounted at /components/card.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./card-page').then((m) => m.CardPage) },
] satisfies Routes;
