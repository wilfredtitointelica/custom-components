import { isOriginHidden } from './overlay';

describe('isOriginHidden', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    // Low on the page: once scrolled, the field is above the container but still inside the viewport.
    root.style.cssText = 'position: fixed; top: 300px; left: 0; width: 300px';
    root.innerHTML = `
      <div class="scroller" style="height: 120px; overflow: auto">
        <div style="height: 600px; padding-top: 20px">
          <button class="origin" style="height: 30px">Field</button>
        </div>
      </div>`;
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('is visible inside the visible part of its scroll container', () => {
    const origin = root.querySelector<HTMLElement>('.origin')!;
    expect(isOriginHidden(origin, null, document)).toBeFalse();
  });

  it('is hidden when its scroll container leaves it out of sight, even with only the page around', () => {
    const origin = root.querySelector<HTMLElement>('.origin')!;
    root.querySelector<HTMLElement>('.scroller')!.scrollTop = 200;
    expect(isOriginHidden(origin, null, document)).toBeTrue();
  });
});
