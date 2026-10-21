import { Routes } from '@angular/router';

/**
 * Internal routes of "Search Dropdown", mounted at /components/search-dropdown.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./search-dropdown-page').then((m) => m.SearchDropdownPage) },
] satisfies Routes;
