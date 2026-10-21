import { Routes } from '@angular/router';

/**
 * Internal routes of "Paginator", mounted at /components/paginator.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./paginator-page').then((m) => m.PaginatorPage) },
] satisfies Routes;
