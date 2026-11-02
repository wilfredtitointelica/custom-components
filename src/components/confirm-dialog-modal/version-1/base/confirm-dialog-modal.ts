import {
  afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, DestroyRef, effect,
  ElementRef, inject, Injectable, Injector, input, OnDestroy, output, signal, TemplateRef, untracked,
  viewChild, ViewContainerRef, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Observable, Subject, Subscription } from 'rxjs';

/** Severity of the knowledge base (.prConfirmDialog--default/--warning/--danger/--error/--success). */
export type IntConfirmSeverity = 'default' | 'warning' | 'danger' | 'error' | 'success';

/** Why the dialog closed, same values as PrimeNG ConfirmEventType. */
export enum IntConfirmEventType {
  ACCEPT = 0,
  REJECT = 1,
  CANCEL = 2,
}

/** Options of IntConfirmationService.confirm(), same as PrimeNG Confirmation. They override the host inputs. */
export interface IntConfirmation {
  /** Key of the host that shows it, for several hosts on one page. */
  key?: string;
  /** Title (.int-confirm-dialog-modal__title). */
  header?: string;
  /** Main message (.int-confirm-dialog-modal__subtitle). */
  message?: string;
  /** int-* extension: secondary text (.prConfirmDialog__text of the knowledge base). */
  detail?: string;
  /** int-* extension: severity; colors the title and the icon. Default 'default'. */
  severity?: IntConfirmSeverity;
  /** Icon class (e.g. "icon icon-alert"). undefined: the icon of the severity; null: no icon. */
  icon?: string | null;
  /** int-* extension: 60px image shown instead of the icon (.prConfirmDialog__icon img). */
  image?: string;
  /** Alternative text of the image. */
  imageAlt?: string;
  /** Called on accept. */
  accept?: () => void;
  /** Called on reject: REJECT (reject button) or CANCEL (close button, Escape). */
  reject?: (type: IntConfirmEventType.REJECT | IntConfirmEventType.CANCEL) => void;
  /** Label of the accept button. Default 'Yes'. */
  acceptLabel?: string;
  /** Label of the reject button. Default 'No'. */
  rejectLabel?: string;
  /** Shows the accept button. */
  acceptVisible?: boolean;
  /** Shows the reject button. */
  rejectVisible?: boolean;
  /** Shows the close button. */
  closable?: boolean;
  /** Accessible label of the close button. Default 'Close'. */
  closeAriaLabel?: string;
}

/** Context of the #message, #icon and #footer templates. */
export interface IntConfirmTemplateContext {
  $implicit: IntConfirmation;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

/** Default icon of each severity (Figma "↳ Message" 13146:53859; the knowledge base defines no glyphs). */
const SEVERITY_ICONS: Record<IntConfirmSeverity, string | null> = {
  default: null,
  warning: 'icon icon-warning',
  danger: 'icon icon-alert',
  error: 'icon icon-overlay-error',
  success: 'icon icon-overlay-success',
};

let nextId = 0;

/**
 * <int-confirm-dialog-modal> · version 1. Replica of PrimeNG v20 p-confirmdialog without PrimeNG at runtime.
 * ConfirmDialog uses a Dialog UI to confirm an action. It is opened with IntConfirmationService.confirm(); mount one
 * host in the layout (or one per key). Fixed behavior (knowledge base): Escape cancels, the mask does not close, body scroll is blocked,
 * the accept button gets the focus and goes first in the DOM (row-reverse puts it on the right).
 * Left out (no knowledge base / Figma backing): target popup, position, breakpoints, draggable, acceptIcon,
 * rejectIcon, defaultFocus, dismissableMask and the #header template.
 */
@Component({
  selector: 'int-confirm-dialog-modal',
  templateUrl: './confirm-dialog-modal.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet, CdkTrapFocus],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class IntConfirmDialogModal implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Clave del host: solo muestra las confirmaciones con la misma key (sin key, las que no tienen). */
  readonly key = input<string>();
  /** Título por defecto; confirm() lo reemplaza. */
  readonly header = input<string>();
  /** Mensaje por defecto; confirm() lo reemplaza. */
  readonly message = input<string>();
  /** Clase del ícono por defecto; null quita el ícono. Sin valor se usa el ícono de la severidad. */
  readonly icon = input<string | null>();
  /** int-* extension: severidad por defecto (colorea título e ícono, .prConfirmDialog--* de la base de conocimientos); confirm() la reemplaza. */
  readonly severity = input<IntConfirmSeverity>('default');
  /** Texto del botón de aceptar. */
  readonly acceptLabel = input<string>('Yes');
  /** Texto del botón de rechazar. */
  readonly rejectLabel = input<string>('No');
  /** Etiqueta accesible del botón de cerrar. */
  readonly closeAriaLabel = input<string>('Close');
  /** Muestra el botón de aceptar. */
  readonly acceptVisible = input(true, { transform: booleanAttribute });
  /** Muestra el botón de rechazar. */
  readonly rejectVisible = input(true, { transform: booleanAttribute });
  /** Muestra el botón de cerrar (X). */
  readonly closable = input(true, { transform: booleanAttribute });

  /** Se emite al cerrar: ACCEPT, REJECT, CANCEL, o undefined si se cerró con close() del servicio. */
  readonly onHide = output<IntConfirmEventType | undefined>();

  /** Template #message: reemplaza título, mensaje y detalle; recibe { $implicit, onAccept, onReject, onCancel }. */
  protected readonly messageTemplate = contentChild<TemplateRef<IntConfirmTemplateContext>>('message');
  /** Template #icon: reemplaza el ícono; recibe { $implicit, onAccept, onReject, onCancel }. */
  protected readonly iconTemplate = contentChild<TemplateRef<IntConfirmTemplateContext>>('icon');
  /** Template #footer: reemplaza los botones; recibe { $implicit, onAccept, onReject, onCancel }. */
  protected readonly footerTemplate = contentChild<TemplateRef<IntConfirmTemplateContext>>('footer');

  private readonly dialogTemplate = viewChild.required<TemplateRef<unknown>>('dialog');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Open confirmation, null while closed. */
  protected readonly active = signal<IntConfirmation | null>(null);

  private readonly uid = nextId++;
  protected readonly titleId = `int-confirm-dialog-modal-title-${this.uid}`;
  protected readonly subtitleId = `int-confirm-dialog-modal-subtitle-${this.uid}`;
  protected readonly textId = `int-confirm-dialog-modal-text-${this.uid}`;

  /** The confirmation over the host inputs, with the PrimeNG defaults. */
  protected readonly resolved = computed(() => {
    const c = this.active() ?? {};
    return {
      header: c.header ?? this.header(),
      message: c.message ?? this.message(),
      severity: c.severity ?? this.severity(),
      acceptLabel: c.acceptLabel ?? this.acceptLabel(),
      rejectLabel: c.rejectLabel ?? this.rejectLabel(),
      acceptVisible: c.acceptVisible ?? this.acceptVisible(),
      rejectVisible: c.rejectVisible ?? this.rejectVisible(),
      closable: c.closable ?? this.closable(),
      closeAriaLabel: c.closeAriaLabel ?? this.closeAriaLabel(),
    };
  });

  protected readonly resolvedIcon = computed(() => {
    const c = this.active();
    const icon = c?.icon !== undefined ? c.icon : this.icon();
    return icon !== undefined ? icon : SEVERITY_ICONS[this.resolved().severity];
  });

  /** Accessible name: the title, or the message when there is no title. With #message, header as aria-label. */
  protected readonly labelledBy = computed(() => {
    if (this.messageTemplate()) return null;
    const { header, message } = this.resolved();
    return header ? this.titleId : message ? this.subtitleId : null;
  });
  protected readonly ariaLabel = computed(() =>
    this.messageTemplate() ? (this.resolved().header ?? this.resolved().message ?? null) : null,
  );
  /** What is not the name: the message (only with a title) and the detail. */
  protected readonly describedBy = computed(() => {
    if (!this.active() || this.messageTemplate()) return null;
    const ids = [];
    if (this.resolved().header && this.resolved().message) ids.push(this.subtitleId);
    if (this.active()?.detail) ids.push(this.textId);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly classes = computed(
    () => `int-confirm-dialog-modal int-confirm-dialog-modal--${this.resolved().severity}`,
  );

  protected readonly context = computed<IntConfirmTemplateContext>(() => ({
    $implicit: this.active() ?? {},
    onAccept: () => this.accept(),
    onReject: () => this.reject(),
    onCancel: () => this.cancel(),
  }));

  private readonly service = inject(IntConfirmationService);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private overlayRef: OverlayRef | null = null;
  private keydownSubscription: Subscription | null = null;
  /** Element focused before opening; it gets the focus back on close. */
  private previousFocus: HTMLElement | null = null;

  constructor() {
    const subscription = this.service.requests$.subscribe((request) => {
      if (request === null) {
        if (this.active()) this.hide(undefined);
      } else if (request.key === this.key()) {
        this.active.set(request);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.detach();
    });

    // Attaches the dialog when a confirmation opens and moves the focus, also when confirm() replaces an open one.
    effect(() => {
      if (!this.active()) return;
      untracked(() => {
        this.attach();
        this.focusDefault();
      });
    });
  }

  /** Acepta: cierra el diálogo y llama a accept. */
  accept(): void {
    const c = this.active();
    if (!c) return;
    this.hide(IntConfirmEventType.ACCEPT);
    c.accept?.();
  }

  /** Rechaza con el botón de rechazar: cierra el diálogo y llama a reject(REJECT). */
  reject(): void {
    const c = this.active();
    if (!c) return;
    this.hide(IntConfirmEventType.REJECT);
    c.reject?.(IntConfirmEventType.REJECT);
  }

  /** Descarta con la X o Escape: cierra el diálogo y llama a reject(CANCEL). */
  cancel(): void {
    const c = this.active();
    if (!c) return;
    this.hide(IntConfirmEventType.CANCEL);
    c.reject?.(IntConfirmEventType.CANCEL);
  }

  /** Si el host se destruye con una confirmación abierta, la descarta (onHide(CANCEL) y reject(CANCEL)). */
  ngOnDestroy(): void {
    this.cancel();
  }

  // TODO(dep:dialog-modal provisional): the CDK overlay (mask, z-index, scroll block, Escape) comes from int-dialog-modal.
  private attach(): void {
    if (this.overlayRef?.hasAttached()) return;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'int-confirm-dialog-modal__mask',
      panelClass: 'int-confirm-dialog-modal__pane',
      // Inline, because .cdk-overlay-pane sets max-width: 100%: 440px on desktop, the viewport width on mobile.
      width: '100%',
      maxWidth: 'var(--int-confirm-dialog-modal-max-width)',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    // Same as PrimeNG: the mask click does not close; Escape cancels.
    this.keydownSubscription = this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancel();
      }
    });
    this.overlayRef.attach(new TemplatePortal(this.dialogTemplate(), this.viewContainerRef));
  }

  private detach(): void {
    this.keydownSubscription?.unsubscribe();
    this.keydownSubscription = null;
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  /** Initial focus: accept → reject → close button → panel. */
  private focusDefault(): void {
    afterNextRender(
      () => {
        const panel = this.panelRef()?.nativeElement;
        if (!panel) return;
        const target =
          panel.querySelector<HTMLElement>('.int-confirm-dialog-modal__accept-button') ??
          panel.querySelector<HTMLElement>('.int-confirm-dialog-modal__reject-button') ??
          panel.querySelector<HTMLElement>('.int-confirm-dialog-modal__close-button') ??
          panel;
        target.focus();
      },
      { injector: this.injector },
    );
  }

  private hide(type: IntConfirmEventType | undefined): void {
    this.active.set(null);
    this.detach();
    this.previousFocus?.focus();
    this.previousFocus = null;
    this.onHide.emit(type);
  }
}

/**
 * Opens confirmations in the <int-confirm-dialog-modal> mounted in the layout, same as PrimeNG ConfirmationService.
 * Unlike PrimeNG it is providedIn root. A host shows the confirmations with its same key (or both without key).
 */
@Injectable({ providedIn: 'root' })
export class IntConfirmationService {
  private readonly requests = new Subject<IntConfirmation | null>();

  /** Canal de solicitudes que escuchan los hosts; null cierra la confirmación abierta. */
  readonly requests$: Observable<IntConfirmation | null> = this.requests.asObservable();

  /** Abre una confirmación (o reemplaza la que está abierta). */
  confirm(confirmation: IntConfirmation): this {
    this.requests.next(confirmation);
    return this;
  }

  /** Cierra la confirmación abierta sin llamar a accept ni a reject. */
  close(): this {
    this.requests.next(null);
    return this;
  }
}
