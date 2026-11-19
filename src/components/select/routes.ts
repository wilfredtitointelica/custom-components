import { Routes } from '@angular/router';

/**
 * Internal routes of "Select", mounted at /components/select.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./select-page').then((m) => m.SelectPage) },
] satisfies Routes;
