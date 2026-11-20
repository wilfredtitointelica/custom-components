import { Routes } from '@angular/router';

/**
 * Internal routes of "Drag and Drop", mounted at /components/draganddrop.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./draganddrop-page').then((m) => m.DraganddropPage) },
] satisfies Routes;
