import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntSkeleton } from './skeleton';
import { IntSkeletonMask } from './skeleton-mask';

@Component({
  imports: [IntSkeleton],
  template: `
    <int-skeleton />
    <int-skeleton width="10rem" height="2rem" borderRadius="1000px" />
    <int-skeleton shape="circle" size="4rem" animation="none" styleClass="extra" />
  `,
})
class BlockHost {}

@Component({
  imports: [IntSkeletonMask],
  // Plain elements with their own classes and sizes stand in for int-* components (the real ones are measured in
  // each component's Skeleton variant): the mask must keep the classes and the box.
  template: `
    <button class="demo demo--small" style="padding: 2px 8px; border: 1px solid; border-radius: 6px" [intSkeleton]="loading()">Small</button>
    <button class="demo demo--large" style="padding: 8px 16px; border: 1px solid; border-radius: 12px" [intSkeleton]="loading()">Large</button>
    <div style="width: 300px"><div class="demo demo--fluid" style="height: 32px" [intSkeleton]="loading()"></div></div>
    <span [intSkeleton]="loading()">Label</span>
  `,
})
class MaskHost {
  readonly loading = signal(true);
}

describe('IntSkeleton', () => {
  it('renders a block of 100% × 1rem by default, hidden from screen readers', () => {
    const fixture = TestBed.createComponent(BlockHost);
    fixture.detectChanges();
    const [block] = fixture.nativeElement.querySelectorAll('int-skeleton') as NodeListOf<HTMLElement>;
    expect(block.className).toBe('int-skeleton');
    expect(block.style.width).toBe('100%');
    expect(block.style.height).toBe('1rem');
    expect(block.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes width, height and borderRadius', () => {
    const fixture = TestBed.createComponent(BlockHost);
    fixture.detectChanges();
    const block = (fixture.nativeElement.querySelectorAll('int-skeleton') as NodeListOf<HTMLElement>)[1];
    expect(block.style.width).toBe('10rem');
    expect(block.style.height).toBe('2rem');
    expect(block.style.borderRadius).toBe('1000px');
  });

  it('size wins over width and height; shape, animation and styleClass set their classes', () => {
    const fixture = TestBed.createComponent(BlockHost);
    fixture.detectChanges();
    const block = (fixture.nativeElement.querySelectorAll('int-skeleton') as NodeListOf<HTMLElement>)[2];
    expect(block.style.width).toBe('4rem');
    expect(block.style.height).toBe('4rem');
    expect(block.classList).toContain('int-skeleton--circle');
    expect(block.classList).toContain('int-skeleton--animation-none');
    expect(block.classList).toContain('extra');
  });
});

describe('IntSkeletonMask', () => {
  // Karma has no Style Guide: give the skeleton colors and the motion duration a value so the paint and the
  // animation resolve (one undefined var voids the whole animation shorthand).
  beforeEach(() => {
    document.documentElement.style.setProperty('--int-skeleton-background', 'rgb(200, 200, 210)');
    document.documentElement.style.setProperty('--int-skeleton-wave-color', 'rgb(240, 240, 245)');
    document.documentElement.style.setProperty('--i-motion-duration-slow', '500ms');
  });
  afterEach(() => {
    document.documentElement.style.removeProperty('--int-skeleton-background');
    document.documentElement.style.removeProperty('--int-skeleton-wave-color');
    document.documentElement.style.removeProperty('--i-motion-duration-slow');
  });

  function setup() {
    const fixture = TestBed.createComponent(MaskHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const [small, large] = root.querySelectorAll<HTMLElement>(':scope > button');
    const masked = [small, large, root.querySelector<HTMLElement>('.demo--fluid')!, root.querySelector<HTMLElement>(':scope > span')!];
    return { fixture, masked };
  }

  it('marks the element as loading: mask class, aria-busy and inert', () => {
    const { masked } = setup();
    for (const el of masked) {
      expect(el.classList).toContain('int-skeleton-mask');
      expect(el.getAttribute('aria-busy')).toBe('true');
      expect(el.hasAttribute('inert')).toBeTrue();
    }
  });

  it('keeps the element classes: size and fluid modifiers stay', () => {
    const { masked } = setup();
    expect(masked[0].classList).toContain('demo--small');
    expect(masked[1].classList).toContain('demo--large');
    expect(masked[2].classList).toContain('demo--fluid');
  });

  it('paints the skeleton and hides the text', () => {
    const { masked } = setup();
    const style = getComputedStyle(masked[3]);
    expect(style.backgroundImage).toContain('linear-gradient');
    expect(style.color).toBe('rgba(0, 0, 0, 0)');
  });

  // Guard: an !important `background` shorthand in the mask pins background-position and the wave stops.
  it('animates the shine: background-position moves over time', async () => {
    const { masked } = setup();
    const at = () => getComputedStyle(masked[3]).backgroundPosition;
    expect(getComputedStyle(masked[3]).animationName).toBe('int-skeleton-wave');
    const first = at();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(at()).not.toBe(first);
  });

  it('does not change the size of the element (no layout jump when the data arrives)', () => {
    const { fixture, masked } = setup();
    const on = masked.map((el) => el.getBoundingClientRect());
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    const off = masked.map((el) => el.getBoundingClientRect());
    on.forEach((rect, i) => {
      expect(rect.width).withContext(`element ${i} width`).toBeCloseTo(off[i].width, 1);
      expect(rect.height).withContext(`element ${i} height`).toBeCloseTo(off[i].height, 1);
    });
  });

  it('removes everything when it turns false', () => {
    const { fixture, masked } = setup();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    for (const el of masked) {
      expect(el.classList).not.toContain('int-skeleton-mask');
      expect(el.hasAttribute('aria-busy')).toBeFalse();
      expect(el.hasAttribute('inert')).toBeFalse();
    }
  });
});
