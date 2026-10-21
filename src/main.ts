import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

// Dev server only: the documentation (titles, descriptions, "Preview pending", code) is read from the
// example.html files when the page loads, so a hot template replacement would leave it stale.
// Any edit to a template reloads the page instead, however `ng serve` was started.
(import.meta as ImportMeta & { hot?: { on(event: string, cb: () => void): void } }).hot?.on(
  'angular:component-update',
  () => location.reload(),
);
