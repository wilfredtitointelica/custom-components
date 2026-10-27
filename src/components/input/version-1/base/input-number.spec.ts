import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { IntInputNumber } from './input-number';

@Component({
  imports: [IntInputNumber, ReactiveFormsModule],
  template: `
    <int-inputnumber [formControl]="control" mode="currency" currency="USD" locale="en-US" [min]="0" [max]="1000" showButtons />
  `,
})
class Host {
  control = new FormControl<number | null>(1234.5);
}

describe('IntInputNumber', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, input, control: fixture.componentInstance.control };
  }

  it('displays the formatted value at rest', () => {
    const { input } = setup();
    expect(input.value).toBe('$1,234.50');
  });

  it('parses typed text, then clamps to max on blur', () => {
    const { fixture, input, control } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    input.value = '2500.75';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe(2500.75);

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(control.value).toBe(1000);
    expect(input.value).toBe('$1,000.00');
    expect(control.touched).toBeTrue();
  });

  it('strips invalid characters while typing', () => {
    const { fixture, input, control } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    input.value = '12a.3.4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('12.34');
    expect(control.value).toBe(12.34);
  });

  it('steps with ArrowUp / ArrowDown', () => {
    const { input, control } = setup();
    control.setValue(10);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(control.value).toBe(11);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(control.value).toBe(9);
  });
});
