import { Routes } from '@angular/router';

/**
 * Internal routes of "Badge", mounted at /components/badge.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./badge-page').then((m) => m.BadgePage) },
] satisfies Routes;
