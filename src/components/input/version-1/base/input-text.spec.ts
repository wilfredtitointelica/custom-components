import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntInputText } from './input-text';

@Component({
  imports: [IntInputText, ReactiveFormsModule],
  template: `<input intInputText intSize="small" [formControl]="control" />`,
})
class Host {
  control = new FormControl('', Validators.required);
}

describe('IntInputText', () => {
  it('applies field classes and reflects the control invalid state once touched', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.classList).toContain('int-input');
    expect(input.classList).toContain('int-input--small');
    expect(input.classList).not.toContain('int-input--invalid');

    fixture.componentInstance.control.markAsTouched();
    fixture.detectChanges();
    expect(input.classList).toContain('int-input--invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
