import { Routes } from '@angular/router';

/**
 * Internal routes of "Accordion", mounted at /components/accordion.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./accordion-page').then((m) => m.AccordionPage) },
] satisfies Routes;
