import { Routes } from '@angular/router';

/**
 * Internal routes of "Chip", mounted at /components/chip.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./chip-page').then((m) => m.ChipPage) },
] satisfies Routes;
