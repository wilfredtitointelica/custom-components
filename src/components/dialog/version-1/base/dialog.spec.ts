import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntDialog } from './dialog';

@Component({
  imports: [IntDialog],
  template: `
    <int-dialog header="Set alert" [(visible)]="visible" dismissableMask size="md" styleClass="custom">
      <input class="first-field" />
      <ng-template #footer><button class="save">Save</button></ng-template>
    </int-dialog>
  `,
})
class Host {
  visible = signal(false);
}

describe('IntDialog', () => {
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
    expect(dialog.querySelector('.int-dialog__footer .save')).not.toBeNull();
  });

  it('applies the size modifier next to styleClass', () => {
    const { overlay, open } = setup();
    open();
    const dialog = overlay.querySelector('[role="dialog"]')!;
    expect(dialog.classList).toContain('int-dialog');
    expect(dialog.classList).toContain('int-dialog--md');
    expect(dialog.classList).toContain('custom');
  });

  it('renders the close button as a labelled text icon-only int-button', () => {
    const { overlay, open } = setup();
    open();
    const close = overlay.querySelector<HTMLButtonElement>('.int-dialog__close')!;
    expect(close.classList).toContain('int-button--text');
    expect(close.classList).toContain('int-button--icon-only');
    expect(close.getAttribute('aria-label')).toBeTruthy();
  });

  it('closes with the close button and updates the two-way binding', () => {
    const { fixture, overlay, open, host } = setup();
    open();
    overlay.querySelector<HTMLButtonElement>('.int-dialog__close')!.click();
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
    overlay.querySelector<HTMLElement>('.int-dialog__mask')!.click();
    fixture.detectChanges();
    expect(host.visible()).toBeFalse();
  });
});

@Component({
  imports: [IntDialog],
  template: `
    <int-dialog [(visible)]="visible" [showHeader]="false" role="alertdialog" ariaLabel="Discard changes"
                      ariaDescribedBy="msg">
      <p id="msg">Discard them?</p>
    </int-dialog>
  `,
})
class AlertHost {
  visible = signal(true);
}

describe('IntDialog headerless alert', () => {
  it('renders role=alertdialog without header, named by ariaLabel and described by the message', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const dialog = overlay.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('.int-dialog__header')).toBeNull();
    expect(dialog.querySelector('.int-dialog__close')).toBeNull();
    expect(dialog.getAttribute('aria-label')).toBe('Discard changes');
    expect(dialog.hasAttribute('aria-labelledby')).toBeFalse();
    expect(dialog.getAttribute('aria-describedby')).toBe('msg');
  });
});
