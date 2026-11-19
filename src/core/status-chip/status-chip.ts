import { Component, computed, input } from '@angular/core';

import { ComponentStatus } from '../../service/catalog.model';

/** Label and icon of each implementation status, in workflow order. */
export const STATUS_META: Readonly<Record<ComponentStatus, { label: string; icon: string }>> = {
  pending: { label: 'Pending', icon: 'icon-loading' },
  'in-progress': { label: 'In progress', icon: 'icon-clock' },
  done: { label: 'Done', icon: 'icon-success' },
};
export const STATUS_ORDER: readonly ComponentStatus[] = ['pending', 'in-progress', 'done'];

/**
 * Chip of a component version's status (static `status` of its base class):
 * Pending (grey) · In progress (orange) · Done (green).
 */
@Component({
  selector: 'app-status-chip',
  template: `
    <i class="icon {{ meta().icon }}" aria-hidden="true"></i>
    {{ meta().label }}
  `,
  host: { '[class]': 'classes()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 28px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
    }
    :host(.doc-is-small) {
      height: 26px;
      padding: 0 10px;
      gap: 6px;
      font-size: 0.75rem;
    }
    .icon {
      font-size: 0.8125rem;
    }
    :host(.doc-is-pending) {
      background: var(--doc-surface-high);
      color: var(--doc-ink-muted);
    }
    :host(.doc-is-in-progress) {
      background: var(--doc-accent-container);
      color: var(--doc-on-accent-container);
    }
    :host(.doc-is-done) {
      background: var(--doc-success-container);
      color: var(--doc-on-success-container);
    }
  `,
})
export class StatusChip {
  /** Missing status = pending (same default as scripts/generate-docs.mjs). */
  readonly status = input<ComponentStatus | undefined>();
  readonly size = input<'md' | 'sm'>('md');

  protected readonly current = computed(() => this.status() ?? 'pending');
  protected readonly meta = computed(() => STATUS_META[this.current()]);
  protected readonly classes = computed(
    () => `doc-is-${this.current()}${this.size() === 'sm' ? ' doc-is-small' : ''}`,
  );
}
