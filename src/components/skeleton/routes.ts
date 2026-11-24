import { Routes } from '@angular/router';

/**
 * Internal routes of "Skeleton", mounted at /components/skeleton.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./skeleton-page').then((m) => m.SkeletonPage) },
] satisfies Routes;
