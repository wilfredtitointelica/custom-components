import { Routes } from '@angular/router';

/**
 * Internal routes of "Breadcrumb", mounted at /components/breadcrumb.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./breadcrumb-page').then((m) => m.BreadcrumbPage) },
] satisfies Routes;
