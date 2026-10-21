import { Routes } from '@angular/router';

/**
 * Internal routes of "Dropdown / Select", mounted at /components/dropdown-select.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./dropdown-select-page').then((m) => m.DropdownSelectPage) },
] satisfies Routes;
