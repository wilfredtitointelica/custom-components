import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntTag } from './tag';

@Component({
  imports: [IntTag],
  template: `
    <int-tag value="Active" severity="success" rounded />
    <int-tag icon="icon icon-check">Default</int-tag>
    <int-tag value="Big" size="large" />
    <int-tag value="Rate" icon="icon icon-check">
      <ng-template #icon><b class="custom-icon">$</b></ng-template>
    </int-tag>
    <int-tag value="Off" severity="danger" disabled />
    <int-tag value="" />
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

  it('uses no severity modifier by default (primary), renders the icon class and skips the empty label', () => {
    const tag = tags()[1];
    expect(tag.className).toBe('int-tag');
    expect(tag.querySelector('.int-tag__icon.icon-check')).not.toBeNull();
    expect(tag.querySelector('.int-tag__label')).toBeNull();
    expect(tag.textContent?.trim()).toBe('Default');
  });

  it('adds the size modifier', () => {
    expect(tags()[2].classList).toContain('int-tag--large');
  });

  it('renders the #icon template instead of the icon input', () => {
    const tag = tags()[3];
    expect(tag.querySelector('.int-tag__icon .custom-icon')).not.toBeNull();
    expect(tag.querySelector('.icon-check')).toBeNull();
    expect(tag.querySelector('.int-tag__label')?.textContent).toBe('Rate');
  });

  it('marks the disabled state', () => {
    const tag = tags()[4];
    expect(tag.classList).toContain('int-tag--disabled');
    expect(tag.getAttribute('aria-disabled')).toBe('true');
  });

  it('skips the label for an empty string value', () => {
    const tag = tags()[5];
    expect(tag.querySelector('.int-tag__label')).toBeNull();
    expect(tag.hasAttribute('aria-disabled')).toBeFalse();
  });
});
