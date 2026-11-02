import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntTag } from './tag';

@Component({
  imports: [IntTag],
  template: `
    <int-tag value="Active" severity="success" rounded />
    <int-tag icon="icon icon-check">Default</int-tag>
    <int-tag value="Big" size="large" />
    <int-tag value="Rate" styleClass="extra">
      <ng-template #icon><b class="custom-icon">$</b></ng-template>
    </int-tag>
  `,
})
class Host {}

function tags(): HTMLElement[] {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('int-tag')];
}

describe('IntTag', () => {
  it('renders the value with severity and rounded modifiers', () => {
    const [tag] = tags();
    expect(tag.textContent?.trim()).toBe('Active');
    expect(tag.classList).toContain('int-tag');
    expect(tag.classList).toContain('int-tag--success');
    expect(tag.classList).toContain('int-tag--rounded');
  });

  it('defaults to secondary, renders the icon class and skips the empty label', () => {
    const tag = tags()[1];
    expect(tag.classList).toContain('int-tag--secondary');
    expect(tag.classList).not.toContain('int-tag--rounded');
    expect(tag.className).not.toMatch(/int-tag--(small|large)/);
    expect(tag.querySelector('.int-tag__icon.icon-check')).not.toBeNull();
    expect(tag.querySelector('.int-tag__label')).toBeNull();
    expect(tag.textContent?.trim()).toBe('Default');
  });

  it('renders the #icon template and adds styleClass to the host', () => {
    const tag = tags()[3];
    expect(tag.querySelector('.int-tag__icon .custom-icon')).not.toBeNull();
    expect(tag.querySelector('.int-tag__label')?.textContent).toBe('Rate');
    expect(tag.classList).toContain('extra');
  });

  it('adds the size modifier', () => {
    expect(tags()[2].classList).toContain('int-tag--large');
  });
});
