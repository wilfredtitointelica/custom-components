import { Component, computed, input } from '@angular/core';

import { ComponentStatus } from '../../service/catalog.model';

/** Label and icon of each implementation status, in workflow order. */
export const STATUS_META: Readonly<Record<ComponentStatus, { label: string; icon: string }>> = {
  pending: { label: 'Pending', icon: 'pi-hourglass' },
  'in-progress': { label: 'In progress', icon: 'pi-clock' },
  done: { label: 'Done', icon: 'pi-check-circle' },
};
export const STATUS_ORDER: readonly ComponentStatus[] = ['pending', 'in-progress', 'done'];

/**
 * Chip of a component version's status (static `status` of its base class):
 * Pending (grey) · In progress (orange) · Done (green).
 */
@Component({
  selector: 'app-status-chip',
  template: `
    <i class="pi {{ meta().icon }}" aria-hidden="true"></i>
    {{ meta().label }}
  `,
  host: { '[class]': 'classes()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 32px;
      padding: 0 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
    }
    :host(.is-small) {
      height: 26px;
      padding: 0 10px;
      gap: 6px;
      font-size: 0.75rem;
    }
    .pi {
      font-size: 0.8125rem;
    }
    :host(.is-pending) {
      background: var(--c-surface-high);
      color: var(--c-ink-muted);
    }
    :host(.is-in-progress) {
      background: var(--c-accent-container);
      color: var(--c-on-accent-container);
    }
    :host(.is-done) {
      background: var(--c-success-container);
      color: var(--c-on-success-container);
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
    () => `is-${this.current()}${this.size() === 'sm' ? ' is-small' : ''}`,
  );
}
