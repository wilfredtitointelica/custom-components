import { Routes } from '@angular/router';

/**
 * Internal routes of "ProgressBar", mounted at /components/progress-bar.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./progress-bar-page').then((m) => m.ProgressBarPage) },
] satisfies Routes;
