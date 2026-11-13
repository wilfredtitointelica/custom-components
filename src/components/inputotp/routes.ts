import { Routes } from '@angular/router';

/**
 * Internal routes of "InputOTP", mounted at /components/inputotp.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./inputotp-page').then((m) => m.InputotpPage) },
] satisfies Routes;
