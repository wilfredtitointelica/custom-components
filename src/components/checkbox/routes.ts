import { Routes } from '@angular/router';

/**
 * Internal routes of "Checkbox", mounted at /components/checkbox.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./checkbox-page').then((m) => m.CheckboxPage) },
] satisfies Routes;
