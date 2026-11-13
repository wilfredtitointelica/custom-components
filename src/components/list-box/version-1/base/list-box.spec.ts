import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { IntListBox } from './list-box';

interface Brand {
  name: string;
  code: string;
  inactive?: boolean;
}

@Component({
  imports: [IntListBox, ReactiveFormsModule],
  template: `
    <int-list-box
      [formControl]="control"
      [options]="brands"
      optionLabel="name"
      optionValue="code"
      optionDisabled="inactive"
      [multiple]="multiple()"
      filter
    />
  `,
})
class Host {
  multiple = signal(false);
  control = new FormControl<unknown>(null);
  brands: Brand[] = [
    { name: 'Visa', code: 'VI' },
    { name: 'Mastercard', code: 'MC' },
    { name: 'Diners', code: 'DI', inactive: true },
    { name: 'American Express', code: 'AX' },
  ];
}

describe('IntListBox', () => {
  function setup(multiple = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.multiple.set(multiple);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const options = () => Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
    return { fixture, el, options, control: fixture.componentInstance.control };
  }

  it('selects an option value on click and exposes aria-selected', () => {
    const { fixture, options, control } = setup();
    options()[1].click();
    fixture.detectChanges();
    expect(control.value).toBe('MC');
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
  });

  it('does not cancel mousedown on options when standalone (list must be able to take focus)', () => {
    const { options } = setup();
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    options()[0].dispatchEvent(event);
    expect(event.defaultPrevented).toBeFalse();
  });

  it('ignores disabled options', () => {
    const { options, control } = setup();
    options()[2].click();
    expect(control.value).toBeNull();
  });

  it('toggles values in multiple mode', () => {
    const { options, control } = setup(true);
    options()[0].click();
    options()[3].click();
    expect(control.value).toEqual(['VI', 'AX']);
    options()[0].click();
    expect(control.value).toEqual(['AX']);
  });

  it('navigates with the keyboard skipping disabled options', () => {
    const { fixture, el, control } = setup();
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    list.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    for (const key of ['ArrowDown', 'ArrowDown']) {
      list.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(control.value).toBe('AX');
  });

  it('filters options and shows the empty filter message', () => {
    const { fixture, el, options } = setup();
    const filter = el.querySelector<HTMLInputElement>('input[role="searchbox"]')!;
    filter.value = 'master';
    filter.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().map((o) => o.textContent?.trim())).toEqual(['Mastercard']);

    filter.value = 'zzz';
    filter.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelector('.int-list-box__empty')?.textContent?.trim()).toBe('No results found');
  });
});
