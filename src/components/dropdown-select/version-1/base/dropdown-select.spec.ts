import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { IntDropdownSelect } from './dropdown-select';

@Component({
  imports: [IntDropdownSelect, ReactiveFormsModule],
  template: `
    <int-dropdown-select [formControl]="control" [options]="cities" optionLabel="name" optionValue="code"
                         placeholder="Select a city" showClear filter [filterThreshold]="threshold" />
  `,
})
class Host {
  control = new FormControl<string | null>(null);
  threshold = 5;
  cities = [
    { name: 'Lima', code: 'LIM' },
    { name: 'Bogotá', code: 'BOG' },
    { name: 'Santiago', code: 'SCL' },
  ];
}

describe('IntDropdownSelect', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="combobox"]');
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    return { fixture, trigger, overlay, control: fixture.componentInstance.control };
  }

  it('shows the placeholder and opens a listbox on click', () => {
    const { fixture, trigger, overlay } = setup();
    expect(trigger.textContent).toContain('Select a city');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(overlay.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('selects an option, closes and renders the label', () => {
    const { fixture, trigger, overlay, control } = setup();
    trigger.click();
    fixture.detectChanges();
    overlay.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
    fixture.detectChanges();
    expect(control.value).toBe('BOG');
    expect(trigger.textContent).toContain('Bogotá');
    expect(overlay.querySelector('[role="option"]')).toBeNull();
  });

  it('supports keyboard selection from the trigger', () => {
    const { fixture, trigger, control } = setup();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(control.value).toBe('BOG');
  });

  it('clears the value', () => {
    const { fixture, control } = setup();
    control.setValue('SCL');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.int-dropdown-select__clear').click();
    expect(control.value).toBeNull();
  });

  it('reflects the disabled state from the form control', () => {
    const { fixture, trigger, overlay, control } = setup();
    control.disable();
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(overlay.querySelector('[role="option"]')).toBeNull();
  });

  it('shows the filter only when there are more options than filterThreshold', () => {
    const { fixture, trigger, overlay } = setup();
    trigger.click();
    fixture.detectChanges();
    expect(overlay.querySelector('.int-list-box__filter')).toBeNull();

    fixture.componentInstance.threshold = 2;
    fixture.detectChanges();
    expect(overlay.querySelector('.int-list-box__filter')).not.toBeNull();
  });
});
