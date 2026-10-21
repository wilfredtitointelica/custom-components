import { Routes } from '@angular/router';

/**
 * Internal routes of "FileUpload", mounted at /components/file-upload.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./file-upload-page').then((m) => m.FileUploadPage) },
] satisfies Routes;
