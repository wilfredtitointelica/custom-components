import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntButton } from './button';

@Component({
  imports: [IntButton],
  template: `
    <button intButton label="Save" severity="secondary" variant="outlined" [loading]="loading()" (click)="clicks = clicks + 1"></button>
    <button intButton icon="icon icon-download" ariaLabel="Download"></button>
  `,
})
class Host {
  loading = signal(false);
  clicks = 0;
}

describe('IntButton', () => {
  it('renders label and modifier classes on the native button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [button] = fixture.nativeElement.querySelectorAll('button');
    expect(button.textContent.trim()).toBe('Save');
    expect(button.classList).toContain('int-button');
    expect(button.classList).toContain('int-button--secondary');
    expect(button.classList).toContain('int-button--outlined');
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('disables and marks busy while loading', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const [button] = fixture.nativeElement.querySelectorAll('button');
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('int-icon.int-button__icon')).not.toBeNull();
  });

  it('marks icon-only buttons and applies aria-label', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const iconButton = fixture.nativeElement.querySelectorAll('button')[1];
    expect(iconButton.classList).toContain('int-button--icon-only');
    expect(iconButton.querySelector('.int-button__icon.icon-download')).not.toBeNull();
    expect(iconButton.getAttribute('aria-label')).toBe('Download');
  });
});
