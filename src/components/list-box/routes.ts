import { Routes } from '@angular/router';

/**
 * Internal routes of "ListBox", mounted at /components/list-box.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./list-box-page').then((m) => m.ListBoxPage) },
] satisfies Routes;
