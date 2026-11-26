import { Routes } from '@angular/router';

/**
 * Internal routes of "Line Chart", mounted at /components/linechart.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./linechart-page').then((m) => m.LinechartPage) },
] satisfies Routes;
