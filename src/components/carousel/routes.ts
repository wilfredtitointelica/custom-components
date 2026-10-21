import { Routes } from '@angular/router';

/**
 * Internal routes of "Carousel", mounted at /components/carousel.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./carousel-page').then((m) => m.CarouselPage) },
] satisfies Routes;
