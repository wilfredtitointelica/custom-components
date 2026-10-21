import { Routes } from '@angular/router';

/**
 * Internal routes of "DatePicker", mounted at /components/date-picker.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./date-picker-page').then((m) => m.DatePickerPage) },
] satisfies Routes;
