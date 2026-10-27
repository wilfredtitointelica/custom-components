import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntAccordionImports, IntAccordionValue } from './accordion';

@Component({
  imports: [IntAccordionImports],
  template: `
    <int-accordion [(value)]="value" [multiple]="multiple()">
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
