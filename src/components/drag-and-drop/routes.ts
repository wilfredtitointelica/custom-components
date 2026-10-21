import { Routes } from '@angular/router';

/**
 * Internal routes of "Drag and Drop", mounted at /components/drag-and-drop.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./drag-and-drop-page').then((m) => m.DragAndDropPage) },
] satisfies Routes;
