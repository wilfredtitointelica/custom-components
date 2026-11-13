import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IntRadioButton } from './radio-button';

@Component({
  imports: [IntRadioButton, ReactiveFormsModule, FormsModule],
  template: `
    @for (type of types; track type) {
      <int-radiobutton class="reactive" name="feeType" [inputId]="type" [value]="type" [formControl]="feeType" />
      <label [for]="type">{{ type }}</label>
    }
    @for (type of types; track type) {
      <int-radiobutton class="template" name="period" [value]="type" [(ngModel)]="period" />
    }
  `,
})
class Host {
  types = ['fixed', 'variable', 'mixed'];
  feeType = new FormControl('variable');
  period = 'fixed';
}

describe('IntRadioButton', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const radios = (cls: string) =>
      Array.from(el.querySelectorAll<HTMLInputElement>(`int-radiobutton.${cls} input[type="radio"]`));
    return { fixture, el, radios, host: fixture.componentInstance };
  }

  it('checks only the radio matching the model', () => {
    const { radios } = setup();
    expect(radios('reactive').map((r) => r.checked)).toEqual([false, true, false]);
  });

  it('updates a shared FormControl and keeps siblings in sync', () => {
    const { fixture, el, radios, host } = setup();
    radios('reactive')[2].click();
    fixture.detectChanges();
    expect(host.feeType.value).toBe('mixed');
    expect(radios('reactive').map((r) => r.checked)).toEqual([false, false, true]);
    const hosts = Array.from(el.querySelectorAll('int-radiobutton.reactive'));
    expect(hosts.map((h) => h.classList.contains('int-input--checked'))).toEqual([false, false, true]);
  });

  it('selects from its <label for>', () => {
    const { el, host } = setup();
    el.querySelector<HTMLLabelElement>('label[for="fixed"]')!.click();
    expect(host.feeType.value).toBe('fixed');
  });

  it('works with ngModel', async () => {
    const { fixture, radios, host } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(radios('template')[0].checked).toBeTrue();
    radios('template')[1].click();
    expect(host.period).toBe('variable');
  });

  it('groups native inputs by name for arrow-key navigation', () => {
    const { radios } = setup();
    expect(new Set(radios('reactive').map((r) => r.name))).toEqual(new Set(['feeType']));
  });

  it('disables every radio bound to a disabled control', () => {
    const { fixture, radios, host } = setup();
    host.feeType.disable();
    fixture.detectChanges();
    expect(radios('reactive').every((r) => r.disabled)).toBeTrue();
  });
});
