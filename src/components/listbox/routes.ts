import { Routes } from '@angular/router';

/**
 * Internal routes of "ListBox", mounted at /components/listbox.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./listbox-page').then((m) => m.ListboxPage) },
] satisfies Routes;
