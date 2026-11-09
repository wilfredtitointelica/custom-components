import { Routes } from '@angular/router';

/**
 * Internal routes of "MultiSelect", mounted at /components/multiselect.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./multiselect-page').then((m) => m.MultiselectPage) },
] satisfies Routes;
