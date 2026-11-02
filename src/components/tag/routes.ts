import { Routes } from '@angular/router';

/**
 * Internal routes of "Tag", mounted at /components/tag.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./tag-page').then((m) => m.TagPage) },
] satisfies Routes;
