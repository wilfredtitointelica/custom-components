import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

import { uniqueId } from '../../../_shared_';

export type IntTabValue = string | number;

/**
 * <int-tabs> · version 1. PrimeNG v20 composition API (WAI-ARIA tabs pattern, manual activation by
 * default). Parts are BEM elements of `int-tabs`: __list, __tab, __panels, __panel.
 *
 * @example
 * <int-tabs [(value)]="tab">
 *   <int-tablist>
 *     <int-tab value="summary">Summary</int-tab>
 *     <int-tab value="detail">Detail</int-tab>
 *   </int-tablist>
 *   <int-tabpanels>
 *     <int-tabpanel value="summary">...</int-tabpanel>
 *     <int-tabpanel value="detail">...</int-tabpanel>
 *   </int-tabpanels>
 * </int-tabs>
 */
@Component({
  selector: 'int-tabs',
  templateUrl: './tabs.html',
  styleUrl: '../styles/_index.scss',
  host: { class: 'int-tabs' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabs {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly value = model<IntTabValue | null>(null);
  /** Activate a tab as soon as it receives keyboard focus. */
  readonly selectOnFocus = input(false, { transform: booleanAttribute });
  /** Render a panel's content only while it is active. */
  readonly lazy = input(false, { transform: booleanAttribute });

  private readonly baseId = uniqueId('int-tabs');

  tabId(value: IntTabValue): string {
    return `${this.baseId}-tab-${value}`;
  }

  panelId(value: IntTabValue): string {
    return `${this.baseId}-panel-${value}`;
  }
}

@Component({
  selector: 'int-tablist',
  template: '<ng-content />',
  host: { class: 'int-tabs__list', role: 'tablist' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabList {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Moves focus between enabled tabs; returns the focused tab element. */
  focusTab(from: HTMLElement, key: string): HTMLElement | undefined {
    const tabs = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(':scope > int-tab:not(.int-tabs__tab--disabled)'),
    );
    const i = tabs.indexOf(from);
    const target =
      key === 'ArrowRight' ? tabs[(i + 1) % tabs.length]
      : key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
      : key === 'Home' ? tabs[0]
      : tabs[tabs.length - 1];
    target?.focus();
    return target;
  }
}

@Component({
  selector: 'int-tab',
  template: '<ng-content />',
  host: {
    class: 'int-tabs__tab',
    role: 'tab',
    '[id]': 'tabs.tabId(value())',
    '[class.int-tabs__tab--active]': 'active()',
    '[class.int-tabs__tab--disabled]': 'disabled()',
    '[attr.tabindex]': 'active() ? 0 : -1',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-controls]': 'tabs.panelId(value())',
    '(click)': 'select()',
    '(keydown)': 'onKeydown($event)',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTab {
  readonly value = input.required<IntTabValue>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly tabs = inject(IntTabs);
  private readonly tabList = inject(IntTabList);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly active = computed(() => this.tabs.value() === this.value());

  select(): void {
    if (!this.disabled()) this.tabs.value.set(this.value());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select();
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = this.tabList.focusTab(this.el.nativeElement, event.key);
    if (target && this.tabs.selectOnFocus()) target.click();
  }
}

@Component({
  selector: 'int-tabpanels',
  template: '<ng-content />',
  host: { class: 'int-tabs__panels' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabPanels {}

@Component({
  selector: 'int-tabpanel',
  template: `
    @if (!tabs.lazy() || active()) {
      <ng-content />
    }
  `,
  host: {
    class: 'int-tabs__panel',
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'tabs.panelId(value())',
    '[attr.aria-labelledby]': 'tabs.tabId(value())',
    '[hidden]': '!active()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabPanel {
  readonly value = input.required<IntTabValue>();
  protected readonly tabs = inject(IntTabs);
  protected readonly active = computed(() => this.tabs.value() === this.value());
}

/** Convenience array: `imports: [...IntTabsImports]`. */
export const IntTabsImports = [IntTabs, IntTabList, IntTab, IntTabPanels, IntTabPanel] as const;
