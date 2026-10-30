import { Routes } from '@angular/router';

/**
 * Internal routes of "ConfirmDialog (Modal)", mounted at /components/confirm-dialog-modal.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./confirm-dialog-modal-page').then((m) => m.ConfirmDialogModalPage) },
] satisfies Routes;
