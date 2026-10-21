import { Routes } from '@angular/router';

/**
 * Internal routes of "Stepper", mounted at /components/stepper.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./stepper-page').then((m) => m.StepperPage) },
] satisfies Routes;
