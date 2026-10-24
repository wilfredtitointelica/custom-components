import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { ExternalResources } from '../service/external-resources';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Not awaited: the style guide CSS applies whenever it arrives.
    provideAppInitializer(() => inject(ExternalResources).start()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // Scroll to #fragment on click, direct load and reload (offset set by the Header).
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      // Re-clicking the selected variant scrolls to it again.
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
