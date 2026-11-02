import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocTab } from '../../service/navigation-state';

/**
 * Features | API tabs of a documentation page, at the end of the title row: they switch the whole
 * page, so they come before the chips bar. Each tab is a link that sets ?tab=api or removes it;
 * doc-page renders the panel of the active one, with the id `<componentId>-panel-<key>`.
 * Roving tabindex: arrows, Home and End move between them.
 */
@Component({
  selector: 'app-doc-tabs',
  imports: [RouterLink],
  templateUrl: './doc-tabs.html',
  styleUrl: './doc-tabs.scss',
  host: {
    class: 'doc-tabs',
    role: 'tablist',
    'aria-label': 'Documentation',
    '(keydown)': 'onKeydown($event)',
  },
})
export class DocTabs {
  readonly active = input.required<DocTab>();
  /** Component ID: prefix of the tab and panel ids. */
  readonly componentId = input.required<string>();
  /** Route of the documentation page. */
  readonly path = input.required<string>();

  protected readonly tabs = [
    { key: 'features', label: 'Features' },
    { key: 'api', label: 'API' },
  ] as const satisfies readonly { key: DocTab; label: string }[];

  /** Arrow keys, Home and End move between the tabs (WAI-ARIA tabs pattern, automatic activation). */
  protected onKeydown(event: KeyboardEvent): void {
    const tabs = [
      ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]'),
    ];
    const current = tabs.indexOf(event.target as HTMLElement);
    if (current < 0) return;
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    target.focus();
    target.click();
  }
}
