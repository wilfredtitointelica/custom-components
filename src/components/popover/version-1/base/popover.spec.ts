import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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


/** Panels mount in the component's own overlay container (appendTo), not in the root one. */
function overlayOf(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.debugElement.query(By.directive(IntPopover)).injector.get(OverlayContainer).getContainerElement();
}
describe('IntPopover', () => {
  it('toggles content anchored to the trigger and closes on Escape', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = overlayOf(fixture);
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

  it('has no arrow by default', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const container = overlayOf(fixture);

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(container.querySelector('.int-popover--arrow')).toBeNull();
  });

  it('draws the arrow pointing at the trigger when arrow is set', () => {
    const fixture = TestBed.createComponent(ArrowHost);
    fixture.detectChanges();
    const container = overlayOf(fixture);

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const panel = container.querySelector<HTMLElement>('.int-popover');
    expect(panel?.classList).toContain('int-popover--arrow');
    expect(panel?.classList).not.toContain('int-popover--flipped');
    expect(panel?.style.getPropertyValue('--int-popover-arrow-left')).toMatch(/^\d+px$/);
  });
});

@Component({
  imports: [IntPopover],
  template: `
    <button (click)="op.toggle($event)">Info</button>
    <int-popover #op arrow ariaLabel="Info"><p>Hello</p></int-popover>
  `,
})
class ArrowHost {}

@Component({
  imports: [IntPopover],
  template: `
    <button (click)="op.toggle($event)">Columns</button>
    <int-popover #op appendTo="self" ariaLabel="Columns"><p class="content">Hello</p></int-popover>
  `,
})
class SelfHost {}

describe('IntPopover appendTo', () => {
  it('mounts the panel inside the component with appendTo="self"', () => {
    const fixture = TestBed.createComponent(SelfHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('int-popover');
    expect(host.querySelector('.int-overlay-container .content')?.textContent).toBe('Hello');
  });
});
