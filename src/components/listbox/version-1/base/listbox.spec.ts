import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { IntListbox } from './listbox';

interface Brand {
  name: string;
  code: string;
  inactive?: boolean;
}

@Component({
  imports: [IntListbox, ReactiveFormsModule],
  template: `
    <int-listbox
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

describe('IntListbox', () => {
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
    expect(el.querySelector('.int-listbox__empty')?.textContent?.trim()).toBe('No results found');
  });
});

@Component({
  imports: [IntListbox, ReactiveFormsModule],
  template: `
    <int-listbox multiple metaKeySelection dragdrop [options]="fees" [formControl]="selected"
                  (onDblClick)="dbl = $any($event.value)" (onDrop)="drops = drops + 1" />
  `,
})
class AdvancedHost {
  fees = ['A', 'B', 'C', 'D'];
  selected = new FormControl<string[]>([]);
  dbl: string | null = null;
  drops = 0;
}

describe('IntListbox metaKeySelection, range, dblclick and dragdrop', () => {
  function setup() {
    const fixture = TestBed.createComponent(AdvancedHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const options = () => Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
    const click = (i: number, init: MouseEventInit = {}) => {
      options()[i].dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
      fixture.detectChanges();
    };
    return { fixture, el, options, click, host: fixture.componentInstance };
  }

  it('replaces the selection on click and adds with Ctrl', () => {
    const { click, host } = setup();
    click(0);
    click(2);
    expect(host.selected.value).toEqual(['C']);
    click(0, { ctrlKey: true });
    expect(host.selected.value).toEqual(['C', 'A']);
  });

  it('selects a range with Shift + click and with Shift + arrows', () => {
    const { fixture, el, click, host } = setup();
    click(1);
    click(3, { shiftKey: true });
    expect(host.selected.value).toEqual(['B', 'C', 'D']);

    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    click(0);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }));
    fixture.detectChanges();
    expect(host.selected.value).toEqual(['A', 'B']);
  });

  it('emits onDblClick with the option value', () => {
    const { fixture, options, host } = setup();
    options()[3].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(host.dbl).toBe('D');
  });

  it('marks the host as draggable and reorders the options (and the source array) on drop', () => {
    const { fixture, el, options, host } = setup();
    expect(el.querySelector('int-listbox')!.classList).toContain('int-listbox--dragdrop');
    const listBox = fixture.debugElement.query(By.directive(IntListbox)).componentInstance as IntListbox;
    const container = {} as CdkDragDrop<unknown[]>['container'];
    // onDropped is protected: called through element access with the fields it reads.
    listBox['onDropped']({ previousIndex: 0, currentIndex: 2, previousContainer: container, container } as CdkDragDrop<
      unknown[]
    >);
    fixture.detectChanges();
    expect(options().map((o) => o.textContent?.trim())).toEqual(['B', 'C', 'A', 'D']);
    expect(host.fees).toEqual(['B', 'C', 'A', 'D']);
    expect(host.drops).toBe(1);
  });
});

@Component({
  imports: [IntListbox, FormsModule],
  template: `
    <div style="height: 3000px"></div>
    <int-listbox [options]="items" [(ngModel)]="value" scrollHeight="80px" />
  `,
})
class ScrollHost {
  items = Array.from({ length: 40 }, (_, i) => `Item ${i}`);
  value = 'Item 35';
}

describe('IntListbox scroll to the selected option', () => {
  afterEach(() => window.scrollTo(0, 0));

  it('scrolls only the list, never the page (a page scroll closed int-select with placement="top")', async () => {
    const fixture = TestBed.createComponent(ScrollHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    window.scrollTo(0, 0);
    const listbox = fixture.debugElement.query(By.directive(IntListbox)).componentInstance as IntListbox;
    listbox.activateSelected();
    fixture.detectChanges();
    await fixture.whenStable();
    const list: HTMLElement = fixture.nativeElement.querySelector('.int-listbox__list');
    const selected: HTMLElement = fixture.nativeElement.querySelector('[aria-selected="true"]');
    const listBox = list.getBoundingClientRect();
    const optionBox = selected.getBoundingClientRect();
    expect(list.scrollTop).toBeGreaterThan(0);
    expect(optionBox.top).toBeGreaterThanOrEqual(listBox.top - 1);
    expect(optionBox.bottom).toBeLessThanOrEqual(listBox.bottom + 1);
    expect(window.scrollY).toBe(0);
    fixture.nativeElement.remove();
  });
});
