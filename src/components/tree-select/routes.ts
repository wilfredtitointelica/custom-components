import { Routes } from '@angular/router';

/**
 * Internal routes of "TreeSelect", mounted at /components/tree-select.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tree-select-page').then((m) => m.TreeSelectPage) },
] satisfies Routes;
