import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeTable", mounted at /components/tree-table.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tree-table-page').then((m) => m.TreeTablePage) },
] satisfies Routes;
