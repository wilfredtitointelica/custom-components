import { Routes } from '@angular/router';

/**
 * Internal routes of "MultiSelect", mounted at /components/multi-select.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./multi-select-page').then((m) => m.MultiSelectPage) },
] satisfies Routes;
