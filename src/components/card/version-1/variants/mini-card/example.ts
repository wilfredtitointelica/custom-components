import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface MiniItem {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly helperTitle: string;
  readonly helperText: string;
  readonly disabled?: boolean;
}

const MOCK_ITEMS: readonly MiniItem[] = [
  {
    id: 'reports', icon: 'pi-chart-bar', title: 'Reports', description: 'Monthly fee and interchange reports',
    helperTitle: 'Updated', helperText: '2 days ago',
  },
  {
    id: 'alerts', icon: 'pi-bell', title: 'Alerts', description: 'Rules that notify unusual fees',
    helperTitle: 'Active', helperText: '12 rules',
  },
  {
    id: 'archive', icon: 'pi-folder', title: 'Archive', description: 'Closed periods, read only',
    helperTitle: 'Status', helperText: 'Unavailable', disabled: true,
  },
];

@Component({
  selector: 'card-mini-card-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardMiniCardExample {
  protected readonly items = MOCK_ITEMS;
  /** Ids of the pressed (marked) cards. */
  protected readonly pressed = signal<ReadonlySet<string>>(new Set());

  protected toggle(item: MiniItem): void {
    if (item.disabled) return;
    this.pressed.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(item.id)) next.add(item.id);
      return next;
    });
  }
}
