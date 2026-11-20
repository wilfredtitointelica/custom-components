import { Routes } from '@angular/router';

/**
 * Internal routes of "ToggleSwitch", mounted at /components/toggleswitch.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./toggleswitch-page').then((m) => m.ToggleswitchPage) },
] satisfies Routes;
