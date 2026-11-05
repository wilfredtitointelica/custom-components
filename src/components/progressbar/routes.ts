import { Routes } from '@angular/router';

/**
 * Internal routes of "ProgressBar", mounted at /components/progressbar.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./progressbar-page').then((m) => m.ProgressbarPage) },
] satisfies Routes;
