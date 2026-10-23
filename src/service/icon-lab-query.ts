import { Injectable, signal } from '@angular/core';

/**
 * Search text of the Icon Lab (top bar field). Shared so the site-wide search can clear it before
 * opening a section, which a previous filter could otherwise hide.
 */
@Injectable({ providedIn: 'root' })
export class IconLabQuery {
  readonly query = signal('');
}
