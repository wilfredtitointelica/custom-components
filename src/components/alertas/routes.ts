import { Routes } from '@angular/router';

/**
 * Internal routes of "Alertas", mounted at /components/alertas.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./alertas-page').then((m) => m.AlertasPage) },
] satisfies Routes;
