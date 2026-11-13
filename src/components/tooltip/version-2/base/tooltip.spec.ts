import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { IntTooltip } from './tooltip';

@Component({
  imports: [IntTooltip],
  template: `
    <button intTooltip="Export to Excel" tooltipPosition="bottom">Export</button>
    <button intTooltip="Description" tooltipTitle="Title here" tooltipPosition="top-left" [tooltipArrow]="false">
      Rate
    </button>
  `,
})
class Host {}

describe('IntTooltip (version 2)', () => {
  function open(index: number) {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    const button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[index];
    button.dispatchEvent(new Event('mouseenter'));
    tick();
    fixture.detectChanges();
    return { fixture, container, button };
  }

  it('shows on hover with role=tooltip, links aria-describedby and hides on leave', fakeAsync(() => {
    const { fixture, container, button } = open(0);
    const tooltip = container.querySelector('[role="tooltip"]')!;
    expect(tooltip.querySelector('.int-tooltip__text')?.textContent?.trim()).toBe('Export to Excel');
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

  it('renders the arrow with the position modifier', fakeAsync(() => {
    const { container } = open(0);
    const tooltip = container.querySelector('[role="tooltip"]')!;
    expect(tooltip.querySelector('.int-tooltip__arrow')).not.toBeNull();
    expect(tooltip.classList).not.toContain('int-tooltip--no-arrow');
    expect(
      tooltip.classList.contains('int-tooltip--bottom') || tooltip.classList.contains('int-tooltip--top'),
    ).toBeTrue();
  }));

  it('renders the title, corner position and no-arrow modifier', fakeAsync(() => {
    const { container } = open(1);
    const tooltip = container.querySelector('[role="tooltip"]')!;
    expect(tooltip.querySelector('.int-tooltip__title')?.textContent?.trim()).toBe('Title here');
    expect(tooltip.classList).toContain('int-tooltip--no-arrow');
    expect(
      tooltip.classList.contains('int-tooltip--top-left') ||
        tooltip.classList.contains('int-tooltip--bottom-left'),
    ).toBeTrue();
  }));
});
