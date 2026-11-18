import { Routes } from '@angular/router';

/**
 * Internal routes of "RadioButton", mounted at /components/radiobutton.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./radiobutton-page').then((m) => m.RadiobuttonPage) },
] satisfies Routes;
