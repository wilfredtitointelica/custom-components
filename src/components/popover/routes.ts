import { Routes } from '@angular/router';

/**
 * Internal routes of "Popover", mounted at /components/popover.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./popover-page').then((m) => m.PopoverPage) },
] satisfies Routes;
