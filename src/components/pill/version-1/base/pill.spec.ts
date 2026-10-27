import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntPill } from './pill';

@Component({
  imports: [IntPill],
  template: `
    <int-pill value="Active" severity="success" rounded />
    <int-pill icon="icon icon-check">Default</int-pill>
  `,
})
class Host {}

describe('IntPill', () => {
  it('renders the value with severity and rounded modifiers', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const pill: HTMLElement = fixture.nativeElement.querySelector('int-pill');
    expect(pill.textContent?.trim()).toBe('Active');
    expect(pill.classList).toContain('int-pill');
    expect(pill.classList).toContain('int-pill--success');
    expect(pill.classList).toContain('int-pill--rounded');
  });

  it('defaults to secondary and renders the icon element', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const pill: HTMLElement = fixture.nativeElement.querySelectorAll('int-pill')[1];
    expect(pill.classList).toContain('int-pill--secondary');
    expect(pill.classList).not.toContain('int-pill--rounded');
    expect(pill.querySelector('.int-pill__icon.icon-check')).not.toBeNull();
  });
});
