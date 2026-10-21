import { Routes } from '@angular/router';

/**
 * Internal routes of "Timeline", mounted at /components/timeline.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./timeline-page').then((m) => m.TimelinePage) },
] satisfies Routes;
