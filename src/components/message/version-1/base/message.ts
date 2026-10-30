import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, input, output, signal, TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type IntMessageSeverity = 'info' | 'success' | 'warn' | 'error' | 'secondary';
export type IntMessageSize = 'small';
export type IntMessageVariant = 'simple';

/** Payload of onClose, same shape as PrimeNG. */
export interface IntMessageCloseEvent {
  originalEvent: Event;
}

/** Context of the #container template: closeCallback closes the message from custom content. */
export interface IntMessageContainerContext {
  closeCallback: (event: Event) => void;
}

/**
 * <int-message> · version 1. Replica of PrimeNG v20 p-message without PrimeNG at runtime.
 * Message component is used to display inline messages. Scope: what the knowledge base, the Style Guide and Figma
 * define; severity contrast, size large, variant outlined, life, the deprecated text/escape and the transition options
 * are left out until a design asks for them.
 */
@Component({
  selector: 'int-message',
  templateUrl: './message.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: the root is the div of the template, the host only wraps it.
  host: { style: 'display: contents' },
})
export class IntMessage {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  readonly severity = input<IntMessageSeverity>('info');
  readonly size = input<IntMessageSize>();
  readonly variant = input<IntMessageVariant>();
  /** Icon class of the incontrol-icons font or primeicons (e.g. "icon icon-info"). */
  readonly icon = input<string>();
  readonly closable = input(false, { transform: booleanAttribute });
  /** Icon class of the close button; without it the button shows icon-cancel. */
  readonly closeIcon = input<string>();

  readonly onClose = output<IntMessageCloseEvent>();

  protected readonly containerTemplate = contentChild<TemplateRef<IntMessageContainerContext>>('container');
  protected readonly iconTemplate = contentChild<TemplateRef<unknown>>('icon');
  protected readonly closeIconTemplate = contentChild<TemplateRef<unknown>>('closeicon');

  /** False once closed: the message leaves the DOM, as in PrimeNG. */
  protected readonly visible = signal(true);

  protected readonly classes = computed(() => {
    const classes = ['int-message', `int-message--${this.severity()}`];
    if (this.size() === 'small') classes.push('int-message--sm');
    if (this.variant()) classes.push(`int-message--${this.variant()}`);
    return classes.join(' ');
  });

  protected readonly closeCallback = (event: Event): void => this.close(event);

  /** Closes the message and emits onClose. */
  close(event: Event): void {
    this.visible.set(false);
    this.onClose.emit({ originalEvent: event });
  }
}
