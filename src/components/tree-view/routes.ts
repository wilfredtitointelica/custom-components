import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeView", mounted at /components/tree-view.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tree-view-page').then((m) => m.TreeViewPage) },
] satisfies Routes;
