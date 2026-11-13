import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntTabValue, IntTabsImports } from './tabs';

@Component({
  imports: [IntTabsImports],
  template: `
    <int-tabs [(value)]="tab">
      <int-tablist>
        <int-tab value="summary">Summary</int-tab>
        <int-tab value="detail">Detail</int-tab>
        <int-tab value="history" disabled>History</int-tab>
      </int-tablist>
      <int-tabpanels>
        <int-tabpanel value="summary">Summary panel</int-tabpanel>
        <int-tabpanel value="detail">Detail panel</int-tabpanel>
        <int-tabpanel value="history">History panel</int-tabpanel>
      </int-tabpanels>
    </int-tabs>
  `,
})
class Host {
  tab = signal<IntTabValue | null>('summary');
}

describe('IntTabs', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const tabs = Array.from(el.querySelectorAll<HTMLElement>('[role="tab"]'));
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    return { fixture, tabs, panels, host: fixture.componentInstance };
  }

  it('links tabs and panels and shows only the active panel', () => {
    const { tabs, panels } = setup();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-controls')).toBe(panels[0].id);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(panels[0].hidden).toBeFalse();
    expect(panels[1].hidden).toBeTrue();
  });

  it('selects on click, ignoring disabled tabs', () => {
    const { fixture, tabs, panels, host } = setup();
    tabs[1].click();
    fixture.detectChanges();
    expect(host.tab()).toBe('detail');
    expect(panels[1].hidden).toBeFalse();
    tabs[2].click();
    expect(host.tab()).toBe('detail');
  });

  it('uses roving tabindex and arrow keys (manual activation)', () => {
    const { fixture, tabs, host } = setup();
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.activeElement).toBe(tabs[1]);
    expect(host.tab()).toBe('summary');
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.tab()).toBe('detail');
  });
});
