import { Routes } from '@angular/router';

/**
 * Internal routes of "Button", mounted at /components/button.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./button-page').then((m) => m.ButtonPage) },
] satisfies Routes;
