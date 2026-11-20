import { Routes } from '@angular/router';

/**
 * Internal routes of "Dialog (Modal)", mounted at /components/dialog.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./dialog-page').then((m) => m.DialogPage) },
] satisfies Routes;
