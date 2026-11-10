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
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Severidad del mensaje: define el fondo, el borde y el color del ícono. */
  readonly severity = input<IntMessageSeverity>('info');
  /** Tamaño del mensaje: `small` reduce el padding, el gap y el texto. */
  readonly size = input<IntMessageSize>();
  /** Variante: `simple` quita el fondo, el borde y el padding. */
  readonly variant = input<IntMessageVariant>();
  /** Clase del ícono, de la fuente incontrol-icons o primeicons (por ejemplo `icon icon-info`). */
  readonly icon = input<string>();
  /** Muestra el botón para cerrar el mensaje. */
  readonly closable = input(false, { transform: booleanAttribute });
  /** Clase del ícono del botón de cerrar; sin ella se usa `icon-cancel`. */
  readonly closeIcon = input<string>();

  /** Se emite al cerrar el mensaje con el botón o con `closeCallback`. */
  readonly onClose = output<IntMessageCloseEvent>();

  /** Template `container`: reemplaza el contenido del mensaje; recibe `{ closeCallback }`. */
  protected readonly containerTemplate = contentChild<TemplateRef<IntMessageContainerContext>>('container');
  /** Template `icon`: reemplaza el ícono del mensaje. */
  protected readonly iconTemplate = contentChild<TemplateRef<unknown>>('icon');
  /** Template `closeicon`: reemplaza el ícono del botón de cerrar. */
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

  /** Cierra el mensaje y emite onClose. */
  close(event: Event): void {
    this.visible.set(false);
    this.onClose.emit({ originalEvent: event });
  }
}
