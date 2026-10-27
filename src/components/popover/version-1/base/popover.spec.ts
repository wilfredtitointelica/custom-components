import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntPopover } from './popover';

@Component({
  imports: [IntPopover],
  template: `
    <button (click)="op.toggle($event)">Columns</button>
    <int-popover #op ariaLabel="Column options"><p class="content">Hello</p></int-popover>
  `,
})
class Host {
  popover = viewChild.required(IntPopover);
}

describe('IntPopover', () => {
  it('toggles content anchored to the trigger and closes on Escape', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    trigger.click();
    fixture.detectChanges();
    expect(container.querySelector('.content')?.textContent).toBe('Hello');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.componentInstance.popover().visible()).toBeTrue();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(container.querySelector('.content')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
