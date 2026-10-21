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
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.main-nav-link')];
    expect(links.map((l) => l.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Components',
      'Prototypes Soon',
      'Interface Lab Soon',
      'Icon Lab Soon',
    ]);
  });
});
