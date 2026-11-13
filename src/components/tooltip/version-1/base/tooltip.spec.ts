import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { IntTooltip } from './tooltip';

@Component({
  imports: [IntTooltip],
  template: `<button intTooltip="Export to Excel" tooltipPosition="bottom">Export</button>`,
})
class Host {}

describe('IntTooltip', () => {
  it('shows on hover with role=tooltip, links aria-describedby and hides on leave', fakeAsync(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.dispatchEvent(new Event('mouseenter'));
    tick();
    fixture.detectChanges();
    const tooltip = container.querySelector('[role="tooltip"]')!;
    expect(tooltip.textContent?.trim()).toBe('Export to Excel');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id);

    button.dispatchEvent(new Event('mouseleave'));
    tick();
    fixture.detectChanges();
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  }));

  it('shows on keyboard focus', fakeAsync(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    fixture.nativeElement.querySelector('button').dispatchEvent(new FocusEvent('focusin'));
    tick();
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
  }));
});
