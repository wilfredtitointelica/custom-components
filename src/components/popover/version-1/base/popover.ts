import { FocusMonitor } from '@angular/cdk/a11y';
import {
  ConnectedPosition,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

import {
  INT_DROPDOWN_POSITIONS,
  IntAppendTo,
  closeWhenOriginHidden,
  connectOverlayContainer,
  intRepositionScrollStrategy,
  provideIntOverlayContainer,
  uniqueId,
} from '../../../_shared_';

/** Same pairs as INT_DROPDOWN_POSITIONS, 4px further away to leave room for the 8×4 beak. */
const ARROW_POSITIONS: ConnectedPosition[] = INT_DROPDOWN_POSITIONS.map((p) => ({
  ...p,
  offsetY: (p.offsetY ?? 0) * 2,
}));

/** Closest the beak center gets to the panel edge: 12px inset (`space/150`) plus half the beak (4px). */
const ARROW_EDGE = 16;

/**
 * <int-popover> · version 1. Floating container anchored to a trigger, opened programmatically with
 * toggle / show / hide; API mirrors PrimeNG v20 Popover. The host is `display: contents`: the
 * `int-popover` block is the panel inside the CDK overlay.
 * Deviation: the arrow is opt-in (`arrow`) and looks like the tooltip beak; PrimeNG always draws one.
 * int-* extensions: `baseZIndex` and `borderless` (transparent border, as the Style Guide `.prPopover`).
 *
 * @example
 * <button intButton label="Columns" (click)="op.toggle($event)"></button>
 * <int-popover #op ariaLabel="Column options">...</int-popover>
 */
@Component({
  selector: 'int-popover',
  templateUrl: './popover.html',
  styleUrl: '../styles/_index.scss',
  host: { style: 'display: contents' },
  providers: [provideIntOverlayContainer()],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntPopover implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Se cierra al hacer clic fuera. */
  readonly dismissable = input(true, { transform: booleanAttribute });
  /**
   * Escape cierra el popover y devuelve el foco al disparador.
   * @defaultValue true
   */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Al abrir, el foco pasa al panel; al cerrar, vuelve al disparador. */
  readonly focusOnShow = input(true, { transform: booleanAttribute });
  /** Clase extra para el panel del popover (se monta en el overlay, fuera del componente). */
  readonly styleClass = input<string | undefined>(undefined);
  /** Nombre accesible del panel (`role="dialog"`). */
  readonly ariaLabel = input<string | undefined>(undefined);
  /**
   * int-* extension: flecha sólida (como la del tooltip) que apunta al centro del disparador; pasa al
   * borde inferior cuando el popover se abre encima.
   */
  readonly arrow = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: borde transparente (sigue midiendo 1px, así el tamaño no cambia), como el popover del Style
   * Guide; p. ej. el menú de productos del header, que se separa del fondo solo con la sombra.
   */
  readonly borderless = input(false, { transform: booleanAttribute });
  /**
   * Dónde se monta el panel: `self` (por defecto, dentro del componente), `body` o un elemento (variable de
   * template, p. ej. `[appendTo]="container"`). En todos los casos se coloca sobre la pantalla y cambia de lado
   * si no hay espacio.
   * @defaultValue 'self'
   */
  readonly appendTo = input<IntAppendTo>('self');
  /**
   * Asigna el `z-index` del panel (`baseZIndex`, o 1000, el nivel de los overlays). En `false` no lo asigna y
   * se define con CSS (`.int-overlay-container`).
   * @defaultValue true
   */
  readonly autoZIndex = input(true, { transform: booleanAttribute });
  /**
   * `z-index` del panel cuando `autoZIndex` está activo; 0 usa 1000. Útil para quedar sobre un encabezado
   * fijo u otro overlay.
   * @defaultValue 0
   */
  readonly baseZIndex = input(0, { transform: numberAttribute });

  /** Se emite al abrirse el popover. */
  readonly onShow = output<void>();
  /** Se emite al cerrarse el popover. */
  readonly onHide = output<void>();

  readonly visible = signal(false);
  protected readonly id = uniqueId('int-popover');
  /** The panel opened above the trigger: the beak goes on the bottom edge. */
  protected readonly flipped = signal(false);
  /** Beak center from the panel's left edge, in px. */
  protected readonly arrowLeft = signal(ARROW_EDGE);

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private readonly injector = inject(Injector);
  private readonly vcr = inject(ViewContainerRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private overlayRef: OverlayRef | null = null;
  private positionChanges: Subscription | null = null;
  private target: HTMLElement | null = null;

  constructor() {
    // Close the panel when a scroll leaves the trigger out of sight (e.g. under a fixed header).
    closeWhenOriginHidden({
      open: () => this.visible(),
      origin: () => this.target,
      panel: () => this.overlayRef?.overlayElement,
      close: () => this.hide(false),
    });
    connectOverlayContainer({
      appendTo: this.appendTo,
      autoZIndex: this.autoZIndex,
      baseZIndex: this.baseZIndex,
    });
  }

  /** Abre el popover si está cerrado y lo cierra si está abierto (mismos argumentos que `show`). */
  toggle(event: Event, target?: HTMLElement): void {
    if (this.visible()) this.hide();
    else this.show(event, target);
  }

  /**
   * Abre el popover anclado a `target` o, si no se pasa, al `currentTarget` del evento (el disparador). Si ya
   * estaba abierto, lo vuelve a anclar.
   */
  show(event: Event | null, target?: HTMLElement): void {
    const anchor = target ?? (event?.currentTarget as HTMLElement | null) ?? null;
    if (!anchor) return;
    if (this.visible()) this.hide(false);
    this.target = anchor;

    const strategy = createFlexibleConnectedPositionStrategy(this.injector, anchor)
      .withPositions(this.arrow() ? ARROW_POSITIONS : INT_DROPDOWN_POSITIONS)
      // No push: pushing it into the viewport detaches the panel from the trigger when the page scrolls.
      .withPush(false)
      .withViewportMargin(8);
    // Created from this component's injector, so it uses its IntOverlayContainer (appendTo).
    this.overlayRef = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: intRepositionScrollStrategy(this.injector),
    });
    if (this.arrow()) {
      // Emitted after the CDK applied the position (push included), so the rects are final.
      this.positionChanges = strategy.positionChanges.subscribe(({ connectionPair }) => {
        this.flipped.set(connectionPair.originY === 'top');
        this.updateArrow(anchor);
      });
    }
    this.overlayRef.attach(new TemplatePortal(this.panel(), this.vcr));
    anchor.setAttribute('aria-expanded', 'true');
    anchor.setAttribute('aria-controls', this.id);

    this.overlayRef.outsidePointerEvents().subscribe((e) => {
      if (this.dismissable() && !anchor.contains(e.target as Node)) this.hide(false);
    });
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape' && this.closeOnEscape()) {
        e.preventDefault();
        this.hide();
      }
    });

    this.visible.set(true);
    if (this.focusOnShow()) {
      queueMicrotask(() => this.overlayRef?.overlayElement.querySelector<HTMLElement>('.int-popover')?.focus());
    }
    this.onShow.emit();
  }

  /**
   * Cierra el popover.
   * @param restoreFocus devuelve el foco al disparador (por defecto true).
   */
  hide(restoreFocus = true): void {
    if (!this.overlayRef) return;
    this.positionChanges?.unsubscribe();
    this.positionChanges = null;
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.target?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && this.focusOnShow() && this.target) {
      this.focusMonitor.focusVia(this.target, 'keyboard');
    }
    this.visible.set(false);
    this.onHide.emit();
  }

  /** Recalcula la posición, p. ej. cuando cambió el tamaño del contenido. */
  align(): void {
    this.overlayRef?.updatePosition();
  }

  ngOnDestroy(): void {
    this.positionChanges?.unsubscribe();
    this.overlayRef?.dispose();
  }

  /** Points the beak at the trigger center, kept clear of the rounded corners. */
  private updateArrow(anchor: HTMLElement): void {
    const panel = this.overlayRef?.overlayElement.querySelector<HTMLElement>('.int-popover');
    if (!panel) return;
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const center = a.left + a.width / 2 - p.left;
    this.arrowLeft.set(Math.round(Math.min(Math.max(center, ARROW_EDGE), Math.max(p.width - ARROW_EDGE, ARROW_EDGE))));
  }
}
