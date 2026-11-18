import { Routes } from '@angular/router';

/**
 * Internal routes of "InputNumber", mounted at /components/inputnumber.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./inputnumber-page').then((m) => m.InputnumberPage) },
] satisfies Routes;
