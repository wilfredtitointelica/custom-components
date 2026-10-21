import { Routes } from '@angular/router';

/**
 * Internal routes of "Password", mounted at /components/password.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./password-page').then((m) => m.PasswordPage) },
] satisfies Routes;
