import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntAccordionImports, IntAccordionValue } from './accordion';

@Component({
  imports: [IntAccordionImports],
  template: `
    <int-accordion [(value)]="value" [multiple]="multiple()" [variant]="variant()" [padded]="padded()">
      <int-accordion-panel value="a">
        <int-accordion-header>A</int-accordion-header>
        <int-accordion-content>Content A</int-accordion-content>
      </int-accordion-panel>
      <int-accordion-panel value="b">
        <int-accordion-header>B</int-accordion-header>
        <int-accordion-content>Content B</int-accordion-content>
      </int-accordion-panel>
      <int-accordion-panel value="c" disabled>
        <int-accordion-header>C</int-accordion-header>
        <int-accordion-content>Content C</int-accordion-content>
      </int-accordion-panel>
    </int-accordion>
  `,
})
class Host {
  value = signal<IntAccordionValue | IntAccordionValue[] | null>('a');
  multiple = signal(false);
  variant = signal<'card' | undefined>(undefined);
  padded = signal(false);
}

describe('IntAccordion', () => {
  function setup(multiple = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.multiple.set(multiple);
    fixture.detectChanges();
    const headers = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.int-accordion__trigger'));
    return { fixture, headers, host: fixture.componentInstance };
  }

  it('wires aria-expanded / aria-controls and opens one panel at a time', () => {
    const { fixture, headers, host } = setup();
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    const region = document.getElementById(headers[0].getAttribute('aria-controls')!)!;
    expect(region.getAttribute('role')).toBe('region');

    headers[1].click();
    fixture.detectChanges();
    expect(host.value()).toBe('b');
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps several panels open in multiple mode', () => {
    const { fixture, headers, host } = setup(true);
    headers[1].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b']);
    headers[0].click();
    expect(host.value()).toEqual(['b']);
  });

  it('adds the card modifier only with variant="card"', () => {
    const { fixture } = setup();
    const accordion: HTMLElement = fixture.nativeElement.querySelector('int-accordion');
    expect(accordion.classList).not.toContain('int-accordion--card');
    fixture.componentInstance.variant.set('card');
    fixture.detectChanges();
    expect(accordion.classList).toContain('int-accordion--card');
  });

  it('insets header and content only with padded (not in the card variant, already padded)', () => {
    // Karma does not load the Style Guide: give the tokens px values (an undefined one voids the padding shorthand).
    const root = document.documentElement.style;
    root.setProperty('--int-accordion-padded-padding-x', '8px');
    root.setProperty('--int-accordion-padding', '20px');
    const { fixture, headers } = setup();
    const accordion: HTMLElement = fixture.nativeElement.querySelector('int-accordion');
    const body: HTMLElement = fixture.nativeElement.querySelector('.int-accordion__content-body');
    expect(getComputedStyle(headers[0]).paddingLeft).toBe('0px');

    fixture.componentInstance.padded.set(true);
    fixture.detectChanges();
    expect(accordion.classList).toContain('int-accordion--padded');
    expect(getComputedStyle(headers[0]).paddingLeft).toBe('8px');
    expect(getComputedStyle(headers[0]).paddingRight).toBe('8px');
    expect(getComputedStyle(body).paddingLeft).toBe('8px');

    fixture.componentInstance.variant.set('card');
    fixture.detectChanges();
    expect(getComputedStyle(headers[0]).paddingLeft).toBe('0px');
    root.removeProperty('--int-accordion-padded-padding-x');
    root.removeProperty('--int-accordion-padding');
  });

  it('disables headers of disabled panels and supports arrow navigation', () => {
    const { headers } = setup();
    expect(headers[2].disabled).toBeTrue();
    headers[0].focus();
    headers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(headers[1]);
    headers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(headers[0]);
  });
});
