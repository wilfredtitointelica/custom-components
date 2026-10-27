import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { STATUS_META, STATUS_ORDER, StatusChip } from '../../../core/status-chip/status-chip';
import { ComponentStatus } from '../../../service/catalog.model';
import { ComponentCatalog, VERSION_QUERY_PARAM } from '../../../service/component-catalog';
import { designerColor, designerInitials, UNASSIGNED_DESIGNER } from '../../../service/designers';
import { FilterMenu, FilterOption } from './filter-menu';

type Filter = ComponentStatus | 'all';

const UNASSIGNED = UNASSIGNED_DESIGNER;

/**
 * /components/status: progress of every component (reference implementations excluded), for the team
 * lead. Status and designer of a component are the ones of its latest version (static `status` and
 * `designer` of its base class).
 */
@Component({
  selector: 'app-status-page',
  imports: [RouterLink, StatusChip, FilterMenu],
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
})
export class StatusPage {
  protected readonly designerColor = designerColor;

  /** ?version=<N> link to one version of a component page. */
  protected versionQuery(version: number): Record<string, number> {
    return { [VERSION_QUERY_PARAM]: version };
  }

  private readonly catalog = inject(ComponentCatalog);

  protected readonly rows = this.catalog
    .components.filter((component) => !component.reference)
    .map((component, index) => {
      const latest = component.versions.at(-1);
      return {
        /** Components it composes (config `requires`): not done = the base uses a provisional. */
        requires: component.requires.map((id) => {
          const required = this.catalog.find(id);
          return {
            id,
            name: required?.name ?? id,
            path: required?.path,
            status: required?.versions.at(-1)?.status ?? ('pending' as ComponentStatus),
          };
        }),
        index: index + 1,
        component,
        latest,
        status: latest?.status ?? ('pending' as ComponentStatus),
        designer: latest?.designer || UNASSIGNED,
      };
    });

  protected readonly summary = STATUS_ORDER.map((status) => {
    const count = this.rows.filter((row) => row.status === status).length;
    return {
      status,
      label: STATUS_META[status].label,
      icon: STATUS_META[status].icon,
      count,
      percent: this.rows.length ? Math.round((count / this.rows.length) * 100) : 0,
    };
  });
  protected readonly donePercent = this.summary.find((s) => s.status === 'done')!.percent;

  /** One card per designer (in order of first appearance in the menu), with their own progress. */
  protected readonly designers = [...new Set(this.rows.map((row) => row.designer))]
    .sort((a, b) => Number(a === UNASSIGNED) - Number(b === UNASSIGNED))
    .map((name) => {
      const own = this.rows.filter((row) => row.designer === name);
      const counts = STATUS_ORDER.map((status) => ({
        status,
        count: own.filter((row) => row.status === status).length,
      }));
      const done = counts.find((c) => c.status === 'done')!.count;
      return {
        name,
        initials: designerInitials(name),
        total: own.length,
        done,
        percent: Math.round((done / own.length) * 100),
        counts,
      };
    });

  /** Options of the table filters ("Todos" first, then one per designer / status with its count). */
  protected readonly designerOptions: readonly FilterOption[] = [
    { value: null, label: 'Todos', count: this.rows.length },
    ...this.designers.map((designer) => ({
      value: designer.name,
      label: designer.name,
      count: designer.total,
      color: this.designerColor(designer.name),
    })),
  ];
  protected readonly statusOptions: readonly FilterOption[] = [
    { value: null, label: 'Todos', count: this.rows.length },
    ...this.summary.map((item) => ({
      value: item.status,
      label: item.label,
      count: item.count,
      icon: item.icon,
    })),
  ];

  protected readonly filter = signal<Filter>('all');
  protected readonly designerFilter = signal<string | null>(null);
  protected readonly hasFilter = computed(() => this.filter() !== 'all' || !!this.designerFilter());
  protected readonly visibleRows = computed(() => {
    const filter = this.filter();
    const designer = this.designerFilter();
    return this.rows.filter(
      (row) => (filter === 'all' || row.status === filter) && (!designer || row.designer === designer),
    );
  });

  /** Clicking the active summary card again shows everything. */
  protected toggleFilter(status: ComponentStatus): void {
    this.filter.update((current) => (current === status ? 'all' : status));
  }

  protected toggleDesigner(name: string): void {
    this.designerFilter.update((current) => (current === name ? null : name));
  }

  protected clearFilters(): void {
    this.filter.set('all');
    this.designerFilter.set(null);
  }
}
