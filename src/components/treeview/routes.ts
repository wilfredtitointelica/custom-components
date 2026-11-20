import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeView", mounted at /components/treeview.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./treeview-page').then((m) => m.TreeviewPage) },
] satisfies Routes;
