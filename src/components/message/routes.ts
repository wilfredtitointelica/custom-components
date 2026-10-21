import { Routes } from '@angular/router';

/**
 * Internal routes of "Message", mounted at /components/message.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./message-page').then((m) => m.MessagePage) },
] satisfies Routes;
