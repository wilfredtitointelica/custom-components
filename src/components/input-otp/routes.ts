import { Routes } from '@angular/router';

/**
 * Internal routes of "InputOTP", mounted at /components/input-otp.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./input-otp-page').then((m) => m.InputOtpPage) },
] satisfies Routes;
