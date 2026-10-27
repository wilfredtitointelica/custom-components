import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntDialogModal } from './dialog-modal';

@Component({
  imports: [IntDialogModal],
  template: `
    <int-dialog-modal header="Set alert" [(visible)]="visible" dismissableMask>
      <input class="first-field" />
      <ng-template #footer><button class="save">Save</button></ng-template>
    </int-dialog-modal>
  `,
})
class Host {
  visible = signal(false);
}

describe('IntDialogModal', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const open = () => {
      fixture.componentInstance.visible.set(true);
      fixture.detectChanges();
    };
    return { fixture, overlay, open, host: fixture.componentInstance };
  }

  it('renders nothing until visible', () => {
    const { overlay } = setup();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders an accessible modal dialog with header, content and footer', () => {
    const { overlay, open } = setup();
    open();
    const dialog = overlay.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    expect(title.textContent?.trim()).toBe('Set alert');
    expect(dialog.querySelector('.first-field')).not.toBeNull();
    expect(dialog.querySelector('.int-dialog-modal__footer .save')).not.toBeNull();
  });

  it('closes with the close button and updates the two-way binding', () => {
    const { fixture, overlay, open, host } = setup();
    open();
    overlay.querySelector<HTMLButtonElement>('.int-dialog-modal__close')!.click();
    fixture.detectChanges();
    expect(host.visible()).toBeFalse();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes on Escape and on mask click', () => {
    const { fixture, overlay, open, host } = setup();
    open();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.visible()).toBeFalse();

    open();
    overlay.querySelector<HTMLElement>('.int-dialog-modal__mask')!.click();
    fixture.detectChanges();
    expect(host.visible()).toBeFalse();
  });
});
