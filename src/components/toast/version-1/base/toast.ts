import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  AnimationCallbackEvent,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injectable,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { Subject } from 'rxjs';

/** Severities of p-toast messages. */
export type IntToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

/** Same values as PrimeNG ToastPositionType. */
export type IntToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

/** Same shape as PrimeNG ToastMessageOptions, typed. */
export interface IntToastMessage {
  severity?: IntToastSeverity;
  summary?: string;
  detail?: string;
  id?: string | number;
  key?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  data?: unknown;
  icon?: string;
  closeIcon?: string;
  styleClass?: string;
  contentStyleClass?: string;
}

/** Payload of onClose, as PrimeNG ToastCloseEvent. */
export interface IntToastCloseEvent {
  message: IntToastMessage;
}

/** Context of the #message template. */
export interface IntToastMessageContext {
  $implicit: IntToastMessage;
}

/** Context of the #headless template: closeFn closes the message. */
export interface IntToastHeadlessContext {
  $implicit: IntToastMessage;
  closeFn: (event: Event) => void;
}

/** A message on screen: internal id to track it plus the values its template needs, computed once. */
interface ToastItem {
  readonly uid: number;
  readonly message: IntToastMessage;
  readonly messageClass: string;
  readonly iconClass: string;
  readonly contentClass: string;  readonly closeIconClass: string;
  /** Closes this message: close button and closeFn of the headless template. */
  readonly closeFn: (event: Event) => void;
}

/** int-* extension: default icon per severity (knowledge base icon map), replaces PrimeNG's SVG icons. */
const SEVERITY_ICONS: Record<IntToastSeverity, string> = {
  success: 'icon icon-success',
  info: 'icon icon-info',
  warn: 'icon icon-warning',
  error: 'icon icon-alert',
  secondary: 'icon icon-loading',
  contrast: 'icon icon-info',
};

/** PrimeNG config.zIndex.modal, the base layer ZIndexUtils uses for toasts. */
const MODAL_Z_INDEX = 1100;

let nextId = 0;
/** Message ids are unique across every int-toast: messages of the toasts in one stack are animated together. */
let nextUid = 0;

/** "300ms" / "0.3s" (a --i-motion-duration-* token) → milliseconds for the Web Animations API. */
function toMs(value: string): number {
  const time = parseFloat(value);
  if (Number.isNaN(time)) return 0;
  return value.trim().endsWith('ms') ? time : time * 1000;
}

/**
 * <int-toast> · version 1. Replica of PrimeNG v20 p-toast without PrimeNG at runtime.
 * Floating notifications raised through IntMessageService, fixed on a corner of the viewport.
 */
@Component({
  selector: 'int-toast',
  templateUrl: './toast.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-toast puts its root classes and position on the host element.
  host: {
    '[class]': 'classes()',
    '[attr.data-int-toast-id]': 'id',
    '[style.z-index]': 'zIndex()',
    '[style.--int-toast-show-transform]': 'showTransformOptions()',
    '[style.--int-toast-hide-transform]': 'hideTransformOptions()',
    '[style.--int-toast-show-transition]': 'showTransitionOptions()',
    '[style.--int-toast-hide-transition]': 'hideTransitionOptions()',
  },
})
export class IntToast {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /**
   * int-* extension: toasts at the same position, in the order they started showing messages. They are
   * laid out as one continuous stack instead of drawing over each other (PrimeNG overlaps them).
   */
  private static readonly stacks = new Map<IntToastPosition, IntToast[]>();

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Clave del toast: solo muestra los mensajes que llegan con la misma `key`. */
  readonly key = input<string>();
  /** Gestiona el `z-index` automáticamente. */
  readonly autoZIndex = input(true, { transform: booleanAttribute });
  /** Valor base del `z-index` cuando `autoZIndex` está activo. */
  readonly baseZIndex = input(0, { transform: numberAttribute });
  /** Tiempo en milisegundos que se muestra cada mensaje, salvo que el mensaje traiga su `life`. */
  readonly life = input(3000, { transform: numberAttribute });
  /** Posición del toast en la ventana. */
  readonly position = input<IntToastPosition>('top-right');
  /** No agrega un mensaje si ya hay uno visible con el mismo contenido. */
  readonly preventOpenDuplicates = input(false, { transform: booleanAttribute });
  /** Muestra una sola vez un mensaje con el mismo contenido. */
  readonly preventDuplicates = input(false, { transform: booleanAttribute });
  /** Transformación de la animación de entrada; por defecto `translateY(100%)`. */
  readonly showTransformOptions = input<string>();
  /** Transformación de la animación de salida; por defecto `translateY(-100%)`. */
  readonly hideTransformOptions = input<string>();
  /** Duración y curva de la animación de entrada (`300ms ease-out`); por defecto, tokens de movimiento. */
  readonly showTransitionOptions = input<string>();
  /** Duración y curva de la animación de salida (`250ms ease-in`); por defecto, tokens de movimiento. */
  readonly hideTransitionOptions = input<string>();
  /** Estilos por ancho de pantalla: `{ '920px': { width: '100%', right: '0' } }`. */
  readonly breakpoints = input<Record<string, Record<string, string>>>();
  /** int-* extension: texto accesible del botón de cerrar (PrimeNG lo toma de su configuración global). */
  readonly closeAriaLabel = input('Close');

  /** Se emite al cerrar un mensaje, con el botón o al vencer su tiempo. */
  readonly onClose = output<IntToastCloseEvent>();

  /** Template del contenido de cada mensaje: `<ng-template #message let-message>`; conserva el botón de cerrar. */
  protected readonly messageTemplate = contentChild<TemplateRef<IntToastMessageContext>>('message');
  /** Template que reemplaza todo el mensaje: `<ng-template #headless let-message let-closeFn="closeFn">`. */
  protected readonly headlessTemplate = contentChild<TemplateRef<IntToastHeadlessContext>>('headless');

  protected readonly id = `int-toast-${nextId++}`;

  /** Messages on screen, oldest first. */
  protected readonly items = signal<readonly ToastItem[]>([]);

  /** Block plus position modifier, as PrimeNG's root classes. */
  protected readonly classes = computed(() => `int-toast int-toast--${this.position()}`);

  protected readonly zIndex = computed(() =>
    this.autoZIndex() ? this.baseZIndex() || MODAL_Z_INDEX : null,
  );

  private readonly messageService = inject(IntMessageService);
  private readonly document = inject(DOCUMENT);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /** Every message ever added, for preventDuplicates. */
  private archive: IntToastMessage[] = [];
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  /** Leave animations requested in the current tick, run together by flushLeaves. */
  private leaving: AnimationCallbackEvent[] = [];
  /** Messages still fading out: while any, the toast keeps its width. */
  private leavingCount = 0;
  /** Messages whose timer fired, closed together by expire. */
  private expired: ToastItem[] = [];

  constructor() {
    const subscriptions = [
      this.messageService.messageObserver.subscribe((messages) => {
        const list = (Array.isArray(messages) ? messages : [messages]).filter((m) => this.canAdd(m));
        if (list.length) this.add(list);
      }),
      this.messageService.clearObserver.subscribe((key) => {
        if (!key || key === this.key()) {
          this.timers.forEach((timer) => clearTimeout(timer));
          this.timers.clear();
          this.items.set([]);
        }
      }),
    ];

    // breakpoints: same media rules PrimeNG writes in <head>, scoped by this toast's id.
    effect((onCleanup) => {
      const breakpoints = this.breakpoints();
      if (!breakpoints) return;
      const style = this.document.createElement('style');
      style.textContent = Object.entries(breakpoints)
        .map(([width, rules]) => {
          const body = Object.entries(rules)
            .map(([prop, value]) => `${prop}:${value} !important;`)
            .join('');
          return `@media screen and (max-width: ${width}) { .int-toast[data-int-toast-id="${this.id}"] { ${body} } }`;
        })
        .join('\n');
      this.document.head.appendChild(style);
      onCleanup(() => style.remove());
    });

    this.host.style.setProperty('--int-toast-stack-offset', '0px');

    inject(DestroyRef).onDestroy(() => {
      this.leaveStack();
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.timers.forEach((timer) => clearTimeout(timer));
    });
  }

  /** Pauses the timer while the pointer is over the message, as PrimeNG. */
  protected pause(item: ToastItem): void {
    this.clearTimer(item.uid);
  }

  protected resume(item: ToastItem): void {
    this.startTimer(item);
  }

  /**
   * Leave, as PrimeNG: the message fades and moves out while its space closes at the same time. The
   * messages that leave together (expired at once, clear) are handled as one group on the next frame:
   * their timers fire in separate callbacks, so a microtask would split the group.
   */
  protected leave(event: AnimationCallbackEvent): void {
    const view = this.document.defaultView;
    if (!this.leaving.length) {
      if (view) view.requestAnimationFrame(() => this.flushLeaves());
      else queueMicrotask(() => this.flushLeaves());
    }
    this.leaving.push(event);
  }

  /**
   * The leaving group exits the flow at once (absolute, same place, full height) and the others slide
   * into the gap. Each leaving message moves the same way and distance as the ones taking its place
   * (a conveyor), so a group never runs over the messages fading out.
   */
  private flushLeaves(): void {
    const events = this.leaving;
    this.leaving = [];
    const leaving = new Set(events.map((event) => event.target as HTMLElement));
    const before = this.positions();
    const shifts = this.leaveShifts(leaving);
    // Measure every place first: detaching one moves the next.
    const places = [...leaving].map((message) => [message, this.edgeOffset(message)] as const);
    // An auto-width toast (width: auto) would shrink to 0 with its messages out of the flow and squeeze
    // them into a vertical line: its width stays frozen until they are gone.
    if (!this.leavingCount) this.host.style.minWidth = `${this.host.offsetWidth}px`;
    this.leavingCount += events.length;
    places.forEach(([message, offset]) => this.detach(message, offset));
    this.layoutStack();
    this.slideFrom(before, 'hide');
    events.forEach((event) => {
      const message = event.target as HTMLElement;
      const complete = () => {
        if (!--this.leavingCount) this.host.style.minWidth = '';
        event.animationComplete();
      };
      if (this.reducedMotion()) return complete();
      // hideTransformOptions wins when given; otherwise the conveyor shift replaces translateY(-100%).
      if (!this.hideTransformOptions())
        message.style.setProperty('--int-toast-hide-transform', `translateY(${shifts.get(message) ?? 0}px)`);
      message.addEventListener('animationend', (e) => e.target === message && complete());
      message.classList.add('int-toast__message--leave');
    });
  }

  /**
   * How far each leaving message moves: the space freed up to it, towards the anchored edge (up for
   * top and center positions, down for bottom ones, where the stack grows upwards).
   */
  private leaveShifts(leaving: Set<HTMLElement>): Map<HTMLElement, number> {
    const fromBottom = this.position().startsWith('bottom');
    // Visual order across the whole stack (several toasts at this position).
    const elements = this.messageElements().sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
    const shifts = new Map<HTMLElement, number>();
    let freed = 0;
    (fromBottom ? elements.reverse() : elements).forEach((el) => {
      if (!leaving.has(el)) return;
      freed += el.offsetHeight + parseFloat(getComputedStyle(el).marginBlockEnd);
      shifts.set(el, fromBottom ? freed : -freed);
    });
    return shifts;
  }

  private add(messages: IntToastMessage[]): void {
    const added = messages.map((message) => this.toItem(message));
    // Enter: the new messages fade and move in; the ones on screen slide to make room with the same timing.
    const before = this.positions();
    // A toast that starts showing messages goes after the others at its position.
    if (!this.items().length) this.joinStack();
    afterNextRender(
      {
        write: () => {
          this.layoutStack();
          this.slideFrom(before, 'show');
        },
      },
      { injector: this.injector },
    );
    this.items.update((items) => [...items, ...added]);
    if (this.preventDuplicates()) this.archive = [...this.archive, ...messages];
    added.forEach((item) => this.startTimer(item));
  }

  private toItem(message: IntToastMessage): ToastItem {
    const severity = message.severity ?? 'info';
    const item: ToastItem = {
      uid: nextUid++,
      message,
      messageClass: `int-toast__message int-toast__message--${severity} ${message.styleClass ?? ''}`.trim(),
      iconClass: `int-toast__message-icon ${message.icon ?? SEVERITY_ICONS[severity]}`,
      contentClass: `int-toast__message-content ${message.contentStyleClass ?? ''}`.trim(),
      closeIconClass: `int-toast__close-icon ${message.closeIcon ?? 'icon icon-cancel'}`,
      closeFn: (event: Event) => {
        event.preventDefault();
        this.close(item);
      },
    };
    return item;
  }

  /** Top of each message on screen by uid: the "first" of FLIP. */
  private positions(): Map<string, number> {
    const tops = new Map<string, number>();
    this.messageElements().forEach((el) => tops.set(el.dataset['uid'] ?? '', el.getBoundingClientRect().top));
    return tops;
  }

  /**
   * FLIP: each message that moved starts at its old place and slides to the new one, with the timing
   * of the enter (show) or leave (hide) animation: show/hideTransitionOptions or the motion tokens.
   */
  private slideFrom(before: Map<string, number>, phase: 'show' | 'hide'): void {
    if (this.reducedMotion()) return;
    const style = getComputedStyle(this.host);
    const custom = style.getPropertyValue(`--int-toast-${phase}-transition`).trim();
    const [time, ...curve] = custom.split(/\s+/);
    const token = phase === 'show' ? 'enter' : 'leave';
    const duration = toMs(custom ? time : style.getPropertyValue(`--int-toast-${token}-duration`));
    const easing = (custom ? curve.join(' ') : style.getPropertyValue(`--int-toast-${token}-easing`).trim()) || 'ease';
    this.messageElements().forEach((el) => {
      const top = before.get(el.dataset['uid'] ?? '');
      const delta = top === undefined ? 0 : top - el.getBoundingClientRect().top;
      if (delta) el.animate([{ translate: `0 ${delta}px` }, { translate: '0 0' }], { duration, easing });
    });
  }

  /**
   * Takes a leaving message out of the flow without moving it: absolute at the same distance from the
   * edge the toast is anchored to (bottom positions grow upwards), so the others can close the gap.
   */
  private detach(message: HTMLElement, offset: number): void {
    message.style.position = 'absolute';
    message.style.insetInline = '0';
    message.style.margin = '0';
    message.style.setProperty(this.position().startsWith('bottom') ? 'bottom' : 'top', `${offset}px`);
  }

  /** Distance from the message to the edge the toast is anchored to. */
  private edgeOffset(message: HTMLElement): number {
    return this.position().startsWith('bottom')
      ? this.host.offsetHeight - message.offsetTop - message.offsetHeight
      : message.offsetTop;
  }

  /** Messages in the flow of every toast in the stack (a leaving one is absolute and no longer counts). */
  private messageElements(): HTMLElement[] {
    return this.stack()
      .flatMap((toast) => Array.from(toast.host.querySelectorAll<HTMLElement>(':scope > .int-toast__message')))
      .filter((el) => el.style.position !== 'absolute');
  }

  /** The toasts sharing this position, this one included; center does not stack. */
  private stack(): IntToast[] {
    const stack = IntToast.stacks.get(this.position());
    return stack?.includes(this) ? stack : [this];
  }

  private joinStack(): void {
    if (this.position() === 'center') return;
    const others = (IntToast.stacks.get(this.position()) ?? []).filter((toast) => toast !== this);
    IntToast.stacks.set(this.position(), [...others, this]);
  }

  private leaveStack(): void {
    IntToast.stacks.forEach((stack, position) => {
      if (!stack.includes(this)) return;
      IntToast.stacks.set(position, stack.filter((toast) => toast !== this));
      stack.find((toast) => toast !== this)?.layoutStack();
    });
  }

  /**
   * Places every toast of the stack after the previous ones: top positions grow downwards, bottom
   * positions upwards (the last toast that started showing messages sits next to the edge).
   */
  private layoutStack(): void {
    const stack = this.stack();
    const fromBottom = this.position().startsWith('bottom');
    let offset = 0;
    (fromBottom ? [...stack].reverse() : stack).forEach((toast) => {
      toast.host.style.setProperty('--int-toast-stack-offset', `${offset}px`);
      offset += toast.host.offsetHeight;
    });
  }

  private reducedMotion(): boolean {
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private canAdd(message: IntToastMessage): boolean {
    if (message.key !== this.key()) return false;
    if (this.preventOpenDuplicates() && this.contains(this.items().map((i) => i.message), message)) return false;
    if (this.preventDuplicates() && this.contains(this.archive, message)) return false;
    return true;
  }

  private contains(collection: IntToastMessage[], message: IntToastMessage): boolean {
    return collection.some(
      (m) => m.summary === message.summary && m.detail === message.detail && m.severity === message.severity,
    );
  }

  private startTimer(item: ToastItem): void {
    if (item.message.sticky) return;
    this.clearTimer(item.uid);
    this.timers.set(
      item.uid,
      setTimeout(() => this.expire(item), item.message.life || this.life() || 3000),
    );
  }

  /**
   * Timers due together (messages added at once) fire in separate tasks; they are closed in one go so
   * the group renders and leaves together.
   */
  private expire(item: ToastItem): void {
    if (!this.expired.length)
      setTimeout(() => {
        const expired = this.expired;
        this.expired = [];
        expired.forEach((i) => this.close(i));
      });
    this.expired.push(item);
  }

  private clearTimer(uid: number): void {
    clearTimeout(this.timers.get(uid));
    this.timers.delete(uid);
  }

  private close(item: ToastItem): void {
    this.clearTimer(item.uid);
    this.items.update((items) => items.filter((i) => i.uid !== item.uid));
    this.onClose.emit({ message: item.message });
  }
}

/**
 * Replica of PrimeNG MessageService (primeng/api): add it to the providers of the view that shows the
 * toast and inject it where messages are raised.
 */
@Injectable()
export class IntMessageService {
  private readonly messageSource = new Subject<IntToastMessage | IntToastMessage[]>();
  private readonly clearSource = new Subject<string | null>();
  readonly messageObserver = this.messageSource.asObservable();
  readonly clearObserver = this.clearSource.asObservable();

  /** Agrega un mensaje. */
  add(message: IntToastMessage): void {
    if (message) this.messageSource.next(message);
  }

  /** Agrega varios mensajes a la vez. */
  addAll(messages: IntToastMessage[]): void {
    if (messages?.length) this.messageSource.next(messages);
  }

  /** Quita los mensajes del toast con esa `key`, o de todos si no se indica. */
  clear(key?: string): void {
    this.clearSource.next(key || null);
  }
}
