import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntPill } from './pill';

@Component({
  imports: [IntPill],
  template: `
    <int-pill value="Active" severity="success" rounded />
    <int-pill icon="icon icon-check">Default</int-pill>
    <int-pill value="Visa" removable ai (onRemove)="removed = removed + 1" />
  `,
})
class Host {
  removed = 0;
}

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

  it('renders the close button on removable pills and emits onRemove', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const pill: HTMLElement = fixture.nativeElement.querySelectorAll('int-pill')[2];
    expect(pill.classList).toContain('int-pill--removable');
    expect(pill.classList).toContain('int-pill--ai');
    expect(pill.classList).not.toContain('int-pill--secondary');
    const close = pill.querySelector<HTMLButtonElement>('.int-pill__remove');
    expect(close?.getAttribute('aria-label')).toBe('Remove');
    close?.click();
    expect(fixture.componentInstance.removed).toBe(1);
  });
});
