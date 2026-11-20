import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { IntSelect } from './select';

@Component({
  imports: [IntSelect, ReactiveFormsModule],
  template: `
    <int-select [formControl]="control" [options]="cities" optionLabel="name" optionValue="code"
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


/** Panels mount in the component's own overlay container (appendTo), not in the root one. */
function overlayOf(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.debugElement.query(By.directive(IntSelect)).injector.get(OverlayContainer).getContainerElement();
}
describe('IntSelect', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="combobox"]');
    const overlay = overlayOf(fixture);
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
    fixture.nativeElement.querySelector('.int-select__clear').click();
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
    expect(overlay.querySelector('.int-listbox__filter')).toBeNull();

    fixture.componentInstance.threshold = 2;
    fixture.detectChanges();
    expect(overlay.querySelector('.int-listbox__filter')).not.toBeNull();
  });
});

@Component({
  imports: [IntSelect],
  template: `
    <div #box class="box"></div>
    <int-select class="self" appendTo="self" [options]="['A', 'B']" [baseZIndex]="1200" />
    <int-select class="box-target" [appendTo]="box" [options]="['A', 'B']" [autoZIndex]="false" />
  `,
})
class AppendToHost {}

describe('IntSelect appendTo', () => {
  function openSelect(fixture: ComponentFixture<AppendToHost>, selector: string): HTMLElement {
    const host: HTMLElement = fixture.nativeElement.querySelector(selector);
    host.querySelector<HTMLElement>('[role="combobox"]')!.click();
    fixture.detectChanges();
    return host;
  }

  it('mounts the panel inside the component by default, with the overlay z-index', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[role="combobox"]').click();
    fixture.detectChanges();
    const container = overlayOf(fixture);
    expect(container.parentElement).toBe(fixture.nativeElement.querySelector('int-select'));
    expect(container.style.zIndex).toBe('1000');
    expect(container.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('mounts the panel inside the component with appendTo="self" and uses baseZIndex', () => {
    const fixture = TestBed.createComponent(AppendToHost);
    fixture.detectChanges();
    const host = openSelect(fixture, '.self');
    const container = host.querySelector<HTMLElement>('.int-overlay-container')!;
    expect(container).not.toBeNull();
    expect(container.style.zIndex).toBe('1200');
    expect(container.querySelectorAll('[role="option"]').length).toBe(2);
  });

  it('mounts the panel in a given element and leaves the z-index to CSS without autoZIndex', () => {
    const fixture = TestBed.createComponent(AppendToHost);
    fixture.detectChanges();
    openSelect(fixture, '.box-target');
    const container = fixture.nativeElement.querySelector('.box > .int-overlay-container') as HTMLElement;
    expect(container).not.toBeNull();
    expect(container.style.zIndex).toBe('');
    expect(container.querySelectorAll('[role="option"]').length).toBe(2);
  });
});

@Component({
  imports: [IntSelect, ReactiveFormsModule],
  template: `<int-select variant="text" [formControl]="control" [options]="[10, 25, 50]" />`,
})
class TextHost {
  control = new FormControl<number | null>(10);
}

describe('IntSelect variant="text"', () => {
  it('marks the host and leaves the selected option out of the list', () => {
    const fixture = TestBed.createComponent(TextHost);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('int-select');
    expect(host.classList).toContain('int-select--text');
    host.querySelector<HTMLElement>('[role="combobox"]')!.click();
    fixture.detectChanges();
    const overlay = overlayOf(fixture);
    expect(overlay.querySelector('.int-select__panel--text')).not.toBeNull();
    const labels = Array.from(overlay.querySelectorAll('[role="option"]')).map((o) => o.textContent?.trim());
    expect(labels).toEqual(['25', '50']);

    overlay.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(50);
    expect(host.querySelector('[role="combobox"]')?.textContent).toContain('50');
  });
});
