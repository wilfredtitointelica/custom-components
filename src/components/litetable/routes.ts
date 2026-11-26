import { Routes } from '@angular/router';

/**
 * Internal routes of "LiteTable", mounted at /components/litetable.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./litetable-page').then((m) => m.LitetablePage) },
] satisfies Routes;
