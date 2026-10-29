import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntButtonElement } from './button-element';

@Component({
  imports: [IntButtonElement],
  template: `
    <int-button label="Save" severity="secondary" size="small" [disabled]="disabled()" (onClick)="clicks = clicks + 1" />
    <int-button type="submit" styleClass="extra">Send</int-button>
  `,
})
class Host {
  disabled = signal(false);
  clicks = 0;
}

describe('IntButtonElement', () => {
  function buttons() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const list: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('int-button > button'));
    return { fixture, list };
  }

  it('renders a native int-button with its modifiers and emits onClick', () => {
    const { fixture, list } = buttons();
    const [save] = list;
    expect(save.classList).toContain('int-button');
    expect(save.classList).toContain('int-button--secondary');
    expect(save.classList).toContain('int-button--small');
    expect(save.type).toBe('button');
    expect(save.textContent?.trim()).toBe('Save');
    save.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('does not emit onClick while disabled', () => {
    const { fixture, list } = buttons();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(list[0].disabled).toBeTrue();
    list[0].click();
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('passes type, styleClass and projected content to the native button', () => {
    const { list } = buttons();
    const send = list[1];
    expect(send.type).toBe('submit');
    expect(send.classList).toContain('extra');
    expect(send.classList).toContain('int-button--primary');
    expect(send.textContent?.trim()).toBe('Send');
  });
});
