import { Routes } from '@angular/router';

/**
 * Internal routes of "Tooltip", mounted at /components/tooltip.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tooltip-page').then((m) => m.TooltipPage) },
] satisfies Routes;
