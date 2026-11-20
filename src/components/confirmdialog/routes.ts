import { Routes } from '@angular/router';

/**
 * Internal routes of "ConfirmDialog (Alert)", mounted at /components/confirmdialog.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./confirmdialog-page').then((m) => m.ConfirmdialogPage) },
] satisfies Routes;
