import { Routes } from '@angular/router';

/**
 * Internal routes of "Demo", mounted at /components/demo.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./demo-page').then((m) => m.DemoPage) },
] satisfies Routes;
