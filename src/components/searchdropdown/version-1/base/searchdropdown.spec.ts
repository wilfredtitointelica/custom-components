import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntSearchdropdown } from './searchdropdown';

/** Lets the panel render and place itself (timers run even when the test window is in the background). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

@Component({
  imports: [IntSearchdropdown],
  template: `
    <div class="scroller" [style]="{ height: '240px', overflow: 'auto' }">
      <div [style]="{ height: '900px', paddingTop: '40px' }">
        <int-searchdropdown appendTo="body" [suggestions]="items" [style]="{ width: '20rem' }" />
      </div>
    </div>
  `,
})
class BodyScrollHost {
  readonly items = ['Service fee', 'Settlement fee', 'Scheme fee'];
  readonly search = viewChild.required(IntSearchdropdown);
}

/** Opens the panel and returns it: the one this test added to the body (others may still be leaving). */
async function open(fixture: ComponentFixture<BodyScrollHost>): Promise<HTMLElement> {
  const before = new Set(document.querySelectorAll('body > .int-searchdropdown__panel'));
  fixture.componentInstance.search().show();
  fixture.detectChanges();
  await fixture.whenStable();
  await settle();
  const panel = [...document.querySelectorAll<HTMLElement>('body > .int-searchdropdown__panel')].find((p) => !before.has(p));
  expect(panel).toBeDefined();
  return panel!;
}

describe('IntSearchdropdown scroll', () => {
  it('keeps an appendTo="body" panel open and attached to the field when an inner container scrolls', async () => {
    const fixture = TestBed.createComponent(BodyScrollHost);
    fixture.detectChanges();
    const panel = await open(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('int-searchdropdown');
    const gap = () => Math.round(panel.getBoundingClientRect().top - host.getBoundingClientRect().bottom);
    const before = gap();

    // The page scrolls inside a div, as the documentation page: the panel follows the field and stays open.
    const scroller: HTMLElement = fixture.nativeElement.querySelector('.scroller');
    scroller.scrollTop = 20;
    scroller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(gap()).toBe(before);
    expect(panel.isConnected).toBeTrue();
  });
});
