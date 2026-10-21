import { Routes } from '@angular/router';

/**
 * Internal routes of "Slider", mounted at /components/slider.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./slider-page').then((m) => m.SliderPage) },
] satisfies Routes;
