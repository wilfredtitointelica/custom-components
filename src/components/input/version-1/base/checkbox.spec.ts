import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntCheckbox } from './checkbox';

@Component({
  imports: [IntCheckbox, ReactiveFormsModule],
  template: `
    <int-checkbox inputId="terms" binary [formControl]="terms" [indeterminate]="mixed()" />
    <label for="terms">Accept</label>

    <int-checkbox binary trueValue="Y" falseValue="N" [formControl]="flag" />

    @for (brand of brands; track brand) {
      <int-checkbox class="brand" [value]="brand" [formControl]="selected" />
    }
  `,
})
class Host {
  mixed = signal(false);
  terms = new FormControl<boolean | null>(false, Validators.requiredTrue);
  flag = new FormControl('N');
  selected = new FormControl<string[]>(['VI']);
  brands = ['VI', 'MC', 'AX'];
}

describe('IntCheckbox', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const inputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    return { fixture, el, inputs, host: fixture.componentInstance };
  }

  it('toggles a binary model and reflects it in the native input', () => {
    const { fixture, inputs, host } = setup();
    inputs()[0].click();
    fixture.detectChanges();
    expect(host.terms.value).toBeTrue();
    expect(inputs()[0].checked).toBeTrue();
    inputs()[0].click();
    expect(host.terms.value).toBeFalse();
  });

  it('toggles from its <label for>', () => {
    const { el, host } = setup();
    el.querySelector<HTMLLabelElement>('label[for="terms"]')!.click();
    expect(host.terms.value).toBeTrue();
  });

  it('uses trueValue / falseValue', () => {
    const { inputs, host } = setup();
    inputs()[1].click();
    expect(host.flag.value).toBe('Y');
    inputs()[1].click();
    expect(host.flag.value).toBe('N');
  });

  it('adds and removes values of an array model shared by a group', () => {
    const { fixture, inputs, host } = setup();
    const group = () => inputs().slice(2);
    expect(group().map((i) => i.checked)).toEqual([true, false, false]);

    group()[2].click();
    fixture.detectChanges();
    expect(host.selected.value).toEqual(['VI', 'AX']);
    group()[0].click();
    fixture.detectChanges();
    expect(host.selected.value).toEqual(['AX']);
    // Siblings bound to the same FormControl stay in sync.
    expect(group().map((i) => i.checked)).toEqual([false, false, true]);
  });

  it('exposes the indeterminate state and clears it on toggle', () => {
    const { fixture, inputs, host } = setup();
    host.mixed.set(true);
    fixture.detectChanges();
    expect(inputs()[0].indeterminate).toBeTrue();
    expect(inputs()[0].getAttribute('aria-checked')).toBe('mixed');

    inputs()[0].click();
    fixture.detectChanges();
    expect(inputs()[0].indeterminate).toBeFalse();
    expect(inputs()[0].getAttribute('aria-checked')).toBeNull();
  });

  it('reflects disabled and invalid states from the form control', () => {
    const { fixture, el, inputs, host } = setup();
    host.terms.markAsTouched();
    fixture.detectChanges();
    expect(el.querySelector('int-checkbox')!.classList).toContain('int-input--invalid');

    host.terms.disable();
    fixture.detectChanges();
    expect(inputs()[0].disabled).toBeTrue();
  });
});
