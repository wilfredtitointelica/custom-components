import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntInputText } from './inputtext';

@Component({
  imports: [IntInputText, ReactiveFormsModule],
  template: `
    <input intInputText intSize="small" [formControl]="control" />
    <input intInputText success [invalid]="forceInvalid" />
  `,
})
class Host {
  control = new FormControl('', Validators.required);
  forceInvalid = false;
}

describe('IntInputText', () => {
  it('applies field classes and reflects the control invalid state once touched', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.classList).toContain('int-inputtext');
    expect(input.classList).toContain('int-inputtext--small');
    expect(input.classList).not.toContain('int-inputtext--invalid');

    fixture.componentInstance.control.markAsTouched();
    fixture.detectChanges();
    expect(input.classList).toContain('int-inputtext--invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('applies the success modifier unless the field is invalid', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelectorAll('input')[1];
    expect(input.classList).toContain('int-inputtext--success');

    fixture.componentInstance.forceInvalid = true;
    fixture.detectChanges();
    expect(input.classList).not.toContain('int-inputtext--success');
    expect(input.classList).toContain('int-inputtext--invalid');
  });
});

/** Style Guide control tokens (tokens.control.draft) in px: Karma does not load the Style Guide bundle. */
const DS_CONTROL_TOKENS: Record<string, string> = {
  '--i-control-border-width': '1px',
  '--i-control-border-color': '#9ca3ba', // without it the `border` shorthand is invalid and the field has no border
  '--i-control-padding-x': '8px',
  '--i-control-padding-y': '6px',
  '--i-control-height': '32px',
  '--i-control-font-size': '14px',
  '--i-control-line-height': '20px',
  '--i-control-sm-height': '24px',
  '--i-control-sm-padding-y': '4px',
  '--i-control-sm-font-size': '12px',
  '--i-control-sm-line-height': '16px',
  '--i-control-lg-height': '40px',
  '--i-control-lg-padding-y': '8px',
  '--i-control-lg-font-size': '16px',
  '--i-typography-lineHeight-lg': '24px',
};

@Component({
  imports: [IntInputText],
  template: `
    <input intInputText intSize="small" />
    <input intInputText />
    <input intInputText intSize="large" />
  `,
})
class SizesHost {}

describe('IntInputText heights (Figma stroke inside: 24 / 32 / 40)', () => {
  const root = document.documentElement.style;
  beforeEach(() => Object.entries(DS_CONTROL_TOKENS).forEach(([name, value]) => root.setProperty(name, value)));
  afterEach(() => Object.keys(DS_CONTROL_TOKENS).forEach((name) => root.removeProperty(name)));

  it('renders small, regular and large at the DS height, border included', () => {
    const fixture = TestBed.createComponent(SizesHost);
    fixture.detectChanges();
    const heights = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('input')).map(
      (input) => input.getBoundingClientRect().height,
    );
    expect(heights).toEqual([24, 32, 40]);
  });
});
