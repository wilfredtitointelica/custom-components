import { Routes } from '@angular/router';

/**
 * Internal routes of "Tabs (V1 / V2)", mounted at /components/tabs.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tabs-page').then((m) => m.TabsPage) },
] satisfies Routes;
