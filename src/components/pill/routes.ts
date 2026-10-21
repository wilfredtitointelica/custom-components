import { Routes } from '@angular/router';

/**
 * Internal routes of "Pill", mounted at /components/pill.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./pill-page').then((m) => m.PillPage) },
] satisfies Routes;
