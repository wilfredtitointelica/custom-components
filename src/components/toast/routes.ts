import { Routes } from '@angular/router';

/**
 * Internal routes of "Toast", mounted at /components/toast.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./toast-page').then((m) => m.ToastPage) },
] satisfies Routes;
