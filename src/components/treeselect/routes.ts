import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeSelect", mounted at /components/treeselect.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./treeselect-page').then((m) => m.TreeselectPage) },
] satisfies Routes;
