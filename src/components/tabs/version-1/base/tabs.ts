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
export type IntTabsOrientation = 'horizontal' | 'vertical';

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
  host: { class: 'int-tabs', '[class.int-tabs--vertical]': "orientation() === 'vertical'" },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabs {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** `value` de la pestaña activa (`[(value)]`); `null` sin pestaña activa. */
  readonly value = model<IntTabValue | null>(null);
  /** Activate a tab as soon as it receives keyboard focus. */
  readonly selectOnFocus = input(false, { transform: booleanAttribute });
  /** Render a panel's content only while it is active. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /**
   * int-* extension (PrimeNG v20 Tabs no tiene orientación): `vertical` apila las pestañas en una columna a la
   * izquierda del contenido, separadas por una línea (filtros avanzados); las flechas Arriba y Abajo mueven el foco.
   * @defaultValue 'horizontal'
   */
  readonly orientation = input<IntTabsOrientation>('horizontal');

  private readonly baseId = uniqueId('int-tabs');

  /** `id` del elemento de la pestaña con ese `value` (lo usa `aria-labelledby` de su panel). */
  tabId(value: IntTabValue): string {
    return `${this.baseId}-tab-${value}`;
  }

  /** `id` del panel con ese `value` (lo usa `aria-controls` de su pestaña). */
  panelId(value: IntTabValue): string {
    return `${this.baseId}-panel-${value}`;
  }
}

@Component({
  selector: 'int-tablist',
  template: '<ng-content />',
  host: {
    class: 'int-tabs__list',
    role: 'tablist',
    '[attr.aria-orientation]': "tabs.orientation() === 'vertical' ? 'vertical' : null",
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTabList {
  protected readonly tabs = inject(IntTabs);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Keys that move the focus: Left/Right, or Up/Down in vertical, plus Home/End. */
  navigationKeys(): readonly string[] {
    return this.tabs.orientation() === 'vertical'
      ? ['ArrowDown', 'ArrowUp', 'Home', 'End']
      : ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
  }

  /** Moves focus between enabled tabs; returns the focused tab element. */
  focusTab(from: HTMLElement, key: string): HTMLElement | undefined {
    const [next, previous] = this.navigationKeys();
    const tabs = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(':scope > int-tab:not(.int-tabs__tab--disabled)'),
    );
    const i = tabs.indexOf(from);
    const target =
      key === next ? tabs[(i + 1) % tabs.length]
      : key === previous ? tabs[(i - 1 + tabs.length) % tabs.length]
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
    if (!this.tabList.navigationKeys().includes(event.key)) return;
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
