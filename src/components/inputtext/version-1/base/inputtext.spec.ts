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
