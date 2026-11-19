import { Routes } from '@angular/router';

/**
 * Internal routes of "InputText", mounted at /components/inputtext.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./inputtext-page').then((m) => m.InputtextPage) },
] satisfies Routes;
