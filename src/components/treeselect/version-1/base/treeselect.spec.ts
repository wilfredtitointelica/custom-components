import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntTreeNode } from '../../../treeview/version-1/base/treeview';
import { IntTreeselect } from './treeselect';
/** Lets the CDK position the panel (timers run even when the test window is in the background, unlike frames). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

const nodes: IntTreeNode[] = [
  { key: '0', label: 'Documents', children: [{ key: '0-0', label: 'Work' }] },
  { key: '1', label: 'Events', children: [{ key: '1-0', label: 'Meeting' }] },
  { key: '2', label: 'Movies', children: [{ key: '2-0', label: 'Al Pacino' }] },
];

@Component({
  imports: [IntTreeselect],
  template: `
    <div class="scroller" [style]="{ height: '240px', overflow: 'auto' }">
      <div [style]="{ height: '900px', paddingTop: '40px' }">
        <int-treeselect selectionMode="multiple" [options]="nodes" placeholder="Select items" />
      </div>
    </div>
  `,
})
class Host {
  nodes = nodes;
}



describe('IntTreeselect appendTo="self"', () => {
  it('shows the whole panel below the field and keeps it there while the container scrolls', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('int-treeselect');
    const trigger = host.querySelector<HTMLElement>('[role="combobox"]')!;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await settle();

    const panel = host.querySelector<HTMLElement>('.int-treeselect__panel')!;
    expect(panel).not.toBeNull();
    // Not collapsed by the 0×0 inline container: the three root nodes are visible.
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(60);
    expect(panel.textContent).toContain('Movies');

    const gap = () => panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom;
    const before = gap();
    expect(before).toBeGreaterThanOrEqual(0);
    fixture.nativeElement.querySelector('.scroller').scrollTop = 25;
    expect(Math.round(gap())).toBe(Math.round(before));
  });
});
