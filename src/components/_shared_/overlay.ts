import { ConnectedPosition, OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT, ElementRef, Injectable, Provider, effect, inject } from '@angular/core';

/** Below the trigger (aligned start), flipping above when there is no room. Used by Select, DatePicker, Popover. */
export const INT_DROPDOWN_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];

/** Same pairs as INT_DROPDOWN_POSITIONS with the "above" ones first: opens upwards, flips below when there is no room. */
export const INT_DROPUP_POSITIONS: ConnectedPosition[] = [
  INT_DROPDOWN_POSITIONS[1],
  INT_DROPDOWN_POSITIONS[0],
  INT_DROPDOWN_POSITIONS[3],
  INT_DROPDOWN_POSITIONS[2],
];

/**
 * Where an overlay panel is mounted, same values as PrimeNG's appendTo: 'self' (inside the component),
 * 'body' or an element (a template variable such as [appendTo]="container").
 */
export type IntAppendTo = 'self' | 'body' | HTMLElement | ElementRef<HTMLElement>;

/** Aura: zIndex.overlay, the level of an overlay moved out of the component (no SG token). */
export const INT_OVERLAY_Z_INDEX = 1000;

/**
 * CDK overlay container owned by one component (`providers: [provideIntOverlayContainer()]`), so its panels can
 * be mounted in the body, inside the component or in any element (`appendTo`) with their own z-index.
 * The CDK resolves the container from the component injector (CdkConnectedOverlay, createOverlayRef).
 * The container keeps the CDK styles (`position: fixed` over the viewport): an ancestor with
 * `transform`/`filter` becomes its containing block and the panel is misplaced, as with any fixed element.
 */
@Injectable()
export class IntOverlayContainer extends OverlayContainer {
  private target: HTMLElement | null = null;
  private zIndex: number | null = null;

  /** Mounts the container in `target` (moving it if it already exists) with `zIndex` (null = CSS). */
  attach(target: HTMLElement, zIndex: number | null): void {
    this.target = target;
    this.zIndex = zIndex;
    const el = this._containerElement;
    if (!el) return;
    if (el.parentElement !== target) target.appendChild(el);
    el.style.zIndex = zIndex == null ? '' : String(zIndex);
  }

  protected override _createContainer(): void {
    const el = this._document.createElement('div');
    el.classList.add('cdk-overlay-container', 'int-overlay-container');
    if (this.zIndex != null) el.style.zIndex = String(this.zIndex);
    (this.target ?? this._document.body).appendChild(el);
    this._containerElement = el;
  }
}

/** Component-level providers of IntOverlayContainer, also as the CDK's OverlayContainer token. */
export function provideIntOverlayContainer(): Provider[] {
  return [IntOverlayContainer, { provide: OverlayContainer, useExisting: IntOverlayContainer }];
}

/**
 * Wires a component's `appendTo` / `autoZIndex` / `baseZIndex` inputs to its IntOverlayContainer
 * (PrimeNG's appendOverlay + ZIndexUtils 'overlay'). Call it in an injection context of a component with
 * `provideIntOverlayContainer()`.
 */
export function connectOverlayContainer(config: {
  appendTo: () => IntAppendTo | null | undefined;
  autoZIndex: () => boolean;
  baseZIndex: () => number;
}): void {
  const container = inject(IntOverlayContainer);
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const document = inject(DOCUMENT);
  effect(() => {
    const appendTo = config.appendTo();
    const target =
      appendTo === 'self' ? host
      : !appendTo || appendTo === 'body' ? document.body
      : appendTo instanceof ElementRef ? appendTo.nativeElement
      : appendTo;
    container.attach(target, config.autoZIndex() ? config.baseZIndex() || INT_OVERLAY_Z_INDEX : null);
  });
}

export type IntPlacement = 'top' | 'bottom' | 'left' | 'right';

const PLACEMENTS: Record<IntPlacement, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
};

const OPPOSITE: Record<IntPlacement, IntPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Preferred placement first, then its opposite as fallback (Tooltip). */
export function placementPositions(placement: IntPlacement): ConnectedPosition[] {
  return [PLACEMENTS[placement], PLACEMENTS[OPPOSITE[placement]]];
}
