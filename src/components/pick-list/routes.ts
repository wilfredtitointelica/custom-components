import { Routes } from '@angular/router';

/**
 * Internal routes of "PickList", mounted at /components/pick-list.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./pick-list-page').then((m) => m.PickListPage) },
] satisfies Routes;
