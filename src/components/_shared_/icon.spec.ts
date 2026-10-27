import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IntIcon, IntIconName } from './icon';

@Component({
  imports: [IntIcon],
  template: `<int-icon class="extra" [name]="name()" />`,
})
class Host {
  name = signal<IntIconName>('chevron-down');
}

describe('IntIcon', () => {
  it('renders the incontrol-icons glyph class and keeps static classes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('int-icon');
    expect(icon.classList).toContain('icon-arrow-down');
    expect(icon.classList).toContain('int-icon');
    expect(icon.classList).toContain('extra');
    expect(icon.getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.name.set('close');
    fixture.detectChanges();
    expect(icon.classList).toContain('icon-cancel');
    expect(icon.classList).not.toContain('icon-arrow-down');
  });

  it('keeps the animated SVG for the spinner', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.name.set('spinner');
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('int-icon');
    expect(icon.querySelector('svg')).not.toBeNull();
    expect(icon.classList).toContain('int-icon-spin');
  });
});
