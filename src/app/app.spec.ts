import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('renders the main navigation with every section', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.rail-item')];
    expect(links.map((l) => [l.querySelector('.rail-label')?.textContent?.trim(), l.classList.contains('is-pending')])).toEqual([
      ['Components', false],
      ['Prototypes', true],
      ['Interface Lab', true],
      ['Icon Lab', true],
    ]);
  });
});
