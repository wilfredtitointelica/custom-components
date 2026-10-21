import { Routes } from '@angular/router';

/**
 * Internal routes of "Input", mounted at /components/input.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./input-page').then((m) => m.InputPage) },
] satisfies Routes;
