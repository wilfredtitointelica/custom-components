import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntButton } from './button';

@Component({
  imports: [IntButton],
  template: `
    <button intButton label="Save" severity="secondary" variant="outlined" [loading]="loading()" (click)="clicks = clicks + 1"></button>
    <button intButton icon="icon icon-download" ariaLabel="Download" [active]="active()"></button>
    <button intButton icon="icon icon-help" label="About this" labelOnHover></button>
    <button intButton icon="icon icon-settings" variant="text" size="small" ariaLabel="Settings"></button>
    <a intButton variant="link" href="#docs" label="Docs" [disabled]="linkDisabled()" (click)="linkClicks = linkClicks + 1; $event.preventDefault()"></a>
  `,
})
class Host {
  loading = signal(false);
  active = signal<boolean | undefined>(undefined);
  linkDisabled = signal(true);
  clicks = 0;
  linkClicks = 0;
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

  it('keeps the label as accessible name when it only shows on hover', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const help = fixture.nativeElement.querySelectorAll('button')[2];
    expect(help.classList).toContain('int-button--label-on-hover');
    expect(help.getAttribute('aria-label')).toBe('About this');
  });

  it('combines text and icon-only modifiers for the bare icon button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const settings = fixture.nativeElement.querySelectorAll('button')[3];
    expect(settings.classList).toContain('int-button--text');
    expect(settings.classList).toContain('int-button--icon-only');
    expect(settings.classList).toContain('int-button--small');
    expect(settings.getAttribute('aria-label')).toBe('Settings');
  });

  it('blocks clicks and navigation on a disabled anchor', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.linkClicks).toBe(0);

    fixture.componentInstance.linkDisabled.set(false);
    fixture.detectChanges();
    expect(link.hasAttribute('tabindex')).toBeFalse();
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.linkClicks).toBe(1);
  });

  it('keeps the pressed look and aria-pressed while active', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].hasAttribute('aria-pressed')).toBeFalse();
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    expect(buttons[1].classList).toContain('int-button--active');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    fixture.componentInstance.active.set(false);
    fixture.detectChanges();
    expect(buttons[1].classList).not.toContain('int-button--active');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });
});
