import { Routes } from '@angular/router';

/**
 * Internal routes of "Table", mounted at /components/table.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./table-page').then((m) => m.TablePage) },
] satisfies Routes;
