import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { IntDropdownSelect } from '../../../dropdown-select/version-1/base/dropdown-select';
import { IntPaginator, IntPaginatorPageChangeEvent } from './paginator';

@Component({
  imports: [IntPaginator],
  template: `
    <int-paginator [rows]="10" [totalRecords]="120" [rowsPerPageOptions]="[10, 20, 30]" showJumpToPageDropdown
                   (onPageChange)="last = $event" />
  `,
})
class Host {
  last: IntPaginatorPageChangeEvent | null = null;
}

/** Overlay container of the n-th select (each select mounts its list in its own container). */
function overlayOf(fixture: ComponentFixture<Host>, index: number): HTMLElement {
  return fixture.debugElement
    .queryAll(By.directive(IntDropdownSelect))
    [index].injector.get(OverlayContainer)
    .getContainerElement();
}

describe('IntPaginator selects', () => {
  // NgModel writes the value into each select asynchronously.
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const selects: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('int-dropdown-select'));
    return { fixture, selects };
  }

  it('renders both selects as text dropdowns showing the page report and the page size', async () => {
    const { selects } = await setup();
    expect(selects.length).toBe(2);
    selects.forEach((s) => expect(s.classList).toContain('int-dropdown-select--text'));
    expect(selects[0].textContent).toContain('1 of 12');
    expect(selects[1].textContent).toContain('10');
  });

  it('changes the page size from the rows per page list, which leaves out the current size', async () => {
    const { fixture, selects } = await setup();
    selects[1].querySelector<HTMLElement>('[role="combobox"]')!.click();
    fixture.detectChanges();
    const options = Array.from(overlayOf(fixture, 1).querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.map((o) => o.textContent?.trim())).toEqual(['20', '30']);
    options[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ page: 0, first: 0, rows: 20, pageCount: 6 });
    expect(selects[1].textContent).toContain('20');
  });

  it('jumps to a page from the jump to page list', async () => {
    const { fixture, selects } = await setup();
    selects[0].querySelector<HTMLElement>('[role="combobox"]')!.click();
    fixture.detectChanges();
    const options = Array.from(overlayOf(fixture, 0).querySelectorAll<HTMLElement>('[role="option"]'));
    options.find((o) => o.textContent?.trim() === '3')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.last?.page).toBe(2);
    expect(selects[0].textContent).toContain('3 of 12');
  });
});
