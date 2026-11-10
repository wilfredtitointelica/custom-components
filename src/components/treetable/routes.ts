import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeTable", mounted at /components/treetable.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./treetable-page').then((m) => m.TreetablePage) },
] satisfies Routes;
