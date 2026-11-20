import { CdkConnectedOverlay, ConnectedPosition, FlexibleConnectedPositionStrategy, OverlayContainer } from '@angular/cdk/overlay';
import {
  DOCUMENT,
  ElementRef,
  Injectable,
  Injector,
  Provider,
  Signal,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

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
 *
 * - `body` / an element: the container keeps the CDK styles (`position: fixed` over the viewport) and the
 *   CDK repositions the panel on scroll. An ancestor with `transform`/`filter` becomes its containing block
 *   and the panel is misplaced, as with any fixed element.
 * - `self` (inline): the container is a 0×0 `position: absolute` box inside the component, so the panel
 *   scrolls with its trigger natively (PrimeNG's relativePosition, like int-multiselect), with no lag behind
 *   the field while scrolling. The CDK still computes the position in viewport coordinates:
 *   - right before each computation (it reads getContainerElement()) the container is translated back to
 *     the viewport origin, so `top`/`left` stay exact; between computations it moves with the component;
 *   - the CDK assumes a viewport-sized container (its box is `width/height: 100%`, the pane `max-*: 100%`,
 *     and `bottom`/`right` are measured from the viewport edges). A viewport-sized box inside the page would
 *     enlarge the scroll area, so what the CDK writes is normalized instead (normalize()): the box stays 0×0,
 *     the pane is capped by the viewport (`100vw`/`100vh`, `max-content` width), and `bottom`/`right` become
 *     `top`/`left` anchored to that edge, kept when the panel resizes (a panel opened above still grows upwards).
 */
@Injectable()
export class IntOverlayContainer extends OverlayContainer {
  private target: HTMLElement | null = null;
  private zIndex: number | null = null;
  private inline = false;
  /** Current translate of an inline container (px). */
  private offset = { x: 0, y: 0 };

  /**
   * Mounts the container in `target` (moving it if it already exists) with `zIndex` (null = CSS).
   * `inline` = appendTo="self": the container scrolls with the component (see the class comment).
   */
  attach(target: HTMLElement, zIndex: number | null, inline = false): void {
    this.releaseTarget();
    this.target = target;
    this.zIndex = zIndex;
    this.inline = inline;
    // The component becomes the containing block of the inline container, so it scrolls with any
    // scrolling ancestor (a static component would leave it attached to the page). Only when static.
    if (inline && this._document.defaultView?.getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
      this.positioned = target;
    }
    const el = this._containerElement;
    if (!el) return;
    if (el.parentElement !== target) target.appendChild(el);
    this.applyStyles(el);
  }

  override ngOnDestroy(): void {
    this.releaseTarget();
    this.mutations?.disconnect();
    this.resizes?.disconnect();
    super.ngOnDestroy();
  }

  /** CDK style writes inside an inline container (normalized before paint, see the class comment). */
  private mutations?: MutationObserver;
  /** Panes anchored by their bottom / right edge, re-placed when their size changes. */
  private resizes?: ResizeObserver;
  /** Edge a pane (or a flexible bounding box) is anchored to, in container coordinates. */
  private readonly anchors = new WeakMap<HTMLElement, IntOverlayAnchor>();
  /** Bounding boxes of overlays with fixed dimensions (viewport-sized for the CDK, 0×0 here). */
  private readonly fixedBoxes = new WeakSet<HTMLElement>();

  /** Rewrites the CDK styles of an inline container for a 0×0 box (see the class comment). */
  private normalize(): void {
    const el = this._containerElement;
    if (!el || !this.inline) return;
    const root = this._document.documentElement;
    // Same viewport size the CDK uses for `bottom` / `right`.
    const width = root.clientWidth;
    const height = root.clientHeight;
    for (const box of Array.from(el.children) as HTMLElement[]) {
      if (!box.classList.contains('cdk-overlay-connected-position-bounding-box')) continue;
      const pane = box.querySelector<HTMLElement>(':scope > .cdk-overlay-pane');
      // The CDK writes 100% on every position; between positions the box keeps the 0 written here.
      if (box.style.width === '100%' || box.style.height === '100%') this.fixedBoxes.add(box);
      if (this.fixedBoxes.has(box)) {
        // Fixed dimensions: the box is the whole viewport and the pane is placed in it with top/bottom/left/right.
        box.style.width = '0';
        box.style.height = '0';
        if (!pane) continue;
        if (!pane.style.width) pane.style.width = 'max-content';
        pane.style.maxWidth ||= '100vw';
        pane.style.maxHeight ||= '100vh';
        this.anchor(pane, width, height);
      } else {
        // Flexible dimensions: the box has its own size and holds the pane; only its edges are rebased.
        this.anchor(box, width, height);
      }
    }
    this.mutations?.takeRecords();
  }

  /**
   * Turns the `bottom` / `right` the CDK wrote into an anchor, then places the element from it. Any other
   * mutation (the panel content changed: filter, expanded node) keeps the anchor and only re-places it.
   * A `top` / `left` different from the one written here is a new CDK position anchored by that edge.
   */
  private anchor(target: HTMLElement, width: number, height: number): void {
    const style = target.style;
    const anchor = this.anchors.get(target) ?? {};
    if (style.bottom) anchor.bottom = height - parseFloat(style.bottom);
    else if (style.top !== anchor.top) anchor.bottom = undefined;
    if (style.right) anchor.right = width - parseFloat(style.right);
    else if (style.left !== anchor.left) anchor.right = undefined;
    style.bottom = '';
    style.right = '';
    this.anchors.set(target, anchor);
    this.place(target);
    this.resizes?.observe(target);
  }

  private place(target: HTMLElement): void {
    const anchor = this.anchors.get(target);
    if (!anchor) return;
    if (anchor.bottom !== undefined) {
      target.style.top = `${anchor.bottom - target.offsetHeight}px`;
      anchor.top = target.style.top;
    }
    if (anchor.right !== undefined) {
      target.style.left = `${anchor.right - target.offsetWidth}px`;
      anchor.left = target.style.left;
    }
  }

  /** Element given `position: relative` for an inline container (restored when that changes). */
  private positioned: HTMLElement | null = null;

  private releaseTarget(): void {
    if (this.positioned) this.positioned.style.position = '';
    this.positioned = null;
  }

  override getContainerElement(): HTMLElement {
    const el = super.getContainerElement();
    if (this.inline) this.alignToViewport(el);
    return el;
  }

  protected override _createContainer(): void {
    const el = this._document.createElement('div');
    el.classList.add('cdk-overlay-container', 'int-overlay-container');
    (this.target ?? this._document.body).appendChild(el);
    this._containerElement = el;
    this.applyStyles(el);
    const view = this._document.defaultView;
    if (view?.MutationObserver) {
      this.mutations = new view.MutationObserver(() => this.normalize());
      this.mutations.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    }
    if (view?.ResizeObserver) {
      this.resizes = new view.ResizeObserver((entries) => {
        if (!this.inline) return;
        for (const entry of entries) this.place(entry.target as HTMLElement);
        this.mutations?.takeRecords();
      });
    }
  }

  private applyStyles(el: HTMLElement): void {
    el.style.zIndex = this.zIndex == null ? '' : String(this.zIndex);
    el.classList.toggle('int-overlay-container--inline', this.inline);
    // Inline: a 0×0 absolute box inside the component; the panel overflows it (visible).
    el.style.position = this.inline ? 'absolute' : '';
    el.style.width = this.inline ? '0' : '';
    el.style.height = this.inline ? '0' : '';
    if (!this.inline) {
      el.style.transform = '';
      this.offset = { x: 0, y: 0 };
    }
  }

  /** Translates the inline container so its top-left corner sits at the viewport origin (0, 0). */
  private alignToViewport(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const x = this.offset.x - rect.left;
    const y = this.offset.y - rect.top;
    if (x === this.offset.x && y === this.offset.y) return;
    this.offset = { x, y };
    el.style.transform = `translate(${x}px, ${y}px)`;
  }
}

/**
 * Edge an inline pane is anchored to (container coordinates) and the top / left last written from it,
 * to tell a new CDK position from a re-placement.
 */
interface IntOverlayAnchor {
  bottom?: number;
  right?: number;
  top?: string;
  left?: string;
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
    container.attach(
      target,
      config.autoZIndex() ? config.baseZIndex() || INT_OVERLAY_Z_INDEX : null,
      appendTo === 'self',
    );
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

// ——— Close the panel when its trigger is no longer visible ———

/**
 * True when `origin` cannot be seen: out of the viewport, clipped by a scroll container, or covered by
 * something else (a fixed/sticky header). Checked at the center of its visible part with elementFromPoint;
 * hitting the panel itself counts as visible.
 */
export function isOriginHidden(origin: HTMLElement, panel: HTMLElement | null | undefined, document: Document): boolean {
  const rect = origin.getBoundingClientRect();
  const { width, height } = viewportSize(document);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, width);
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, height);
  if (right <= left || bottom <= top) return true;
  const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
  if (!hit) return false;
  return !origin.contains(hit) && !hit.contains(origin) && !panel?.contains(hit);
}

/**
 * While `open()` is true, closes the panel when a scroll (of the page or of any container) leaves its trigger
 * out of sight, e.g. under a fixed header: otherwise the CDK / the manual placement keeps it floating
 * over unrelated content. The scroll of the panel's own content does not count. Call it in an injection context.
 */
export function closeWhenOriginHidden(config: {
  open: () => boolean;
  origin: () => HTMLElement | null | undefined;
  panel: () => HTMLElement | null | undefined;
  close: () => void;
}): void {
  const document = inject(DOCUMENT);
  effect((onCleanup) => {
    if (!config.open()) return;
    const view = document.defaultView;
    if (!view) return;
    let frame = 0;
    const check = (): void => {
      frame = 0;
      const origin = config.origin();
      if (origin && isOriginHidden(origin, config.panel(), document)) config.close();
    };
    const onScroll = (event: Event): void => {
      const panel = config.panel();
      if (panel && event.target instanceof Node && panel.contains(event.target)) return;
      if (!frame) frame = view.requestAnimationFrame(check);
    };
    view.addEventListener('scroll', onScroll, true);
    onCleanup(() => {
      view.removeEventListener('scroll', onScroll, true);
      if (frame) view.cancelAnimationFrame(frame);
    });
  });
}

// ——— avoidElements: elements an open panel must not cover ———

/** An element the panel must not cover: a CSS selector, an element or a template variable. */
export type IntAvoidTarget = string | HTMLElement | ElementRef<HTMLElement>;
/** Value of the `avoidElements` input: one target or a list (`[applyBtn, '.otro']`). */
export type IntAvoidElements = IntAvoidTarget | readonly IntAvoidTarget[];

/** Beside the trigger (right, then left), aligned with its top edge or, when there is no room, with its bottom edge. */
export const INT_SIDE_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 4 },
  { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 4 },
  { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top', offsetX: -4 },
  { originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'bottom', offsetX: -4 },
];

/** Viewport rects of the visible elements in `value` (selectors are resolved in the whole document). */
export function resolveAvoidRects(value: IntAvoidElements | null | undefined, document: Document): DOMRect[] {
  if (!value) return [];
  const targets = (Array.isArray(value) ? value : [value]) as IntAvoidTarget[];
  const elements = targets.flatMap((target): Element[] =>
    typeof target === 'string' ? Array.from(document.querySelectorAll(target))
    : target instanceof ElementRef ? [target.nativeElement]
    : target ? [target]
    : [],
  );
  return elements.map((el) => el.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
}

/** Where a panel of `size` would be placed with `position` against `origin` (viewport coordinates, LTR). */
export function rectFor(position: ConnectedPosition, origin: DOMRect, size: { width: number; height: number }): DOMRect {
  const ox =
    position.originX === 'start' ? origin.left
    : position.originX === 'end' ? origin.right
    : origin.left + origin.width / 2;
  const oy =
    position.originY === 'top' ? origin.top
    : position.originY === 'bottom' ? origin.bottom
    : origin.top + origin.height / 2;
  const x =
    (position.overlayX === 'start' ? ox
    : position.overlayX === 'end' ? ox - size.width
    : ox - size.width / 2) + (position.offsetX ?? 0);
  const y =
    (position.overlayY === 'top' ? oy
    : position.overlayY === 'bottom' ? oy - size.height
    : oy - size.height / 2) + (position.offsetY ?? 0);
  return new DOMRect(x, y, size.width, size.height);
}

function overlapArea(a: DOMRect, b: DOMRect): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * First candidate that fits in the viewport (minus `margin`) without covering any of `avoid`; when every
 * fitting candidate covers something, the one that covers the least area. Null when none fits.
 */
export function pickAvoidingPosition(
  candidates: readonly ConnectedPosition[],
  origin: DOMRect,
  size: { width: number; height: number },
  avoid: readonly DOMRect[],
  viewport: { width: number; height: number },
  margin = 8,
): ConnectedPosition | null {
  let best: ConnectedPosition | null = null;
  let bestArea = Infinity;
  for (const position of candidates) {
    const rect = rectFor(position, origin, size);
    const fits =
      rect.left >= margin &&
      rect.top >= margin &&
      rect.right <= viewport.width - margin &&
      rect.bottom <= viewport.height - margin;
    if (!fits) continue;
    const area = avoid.reduce((sum, other) => sum + overlapArea(rect, other), 0);
    if (area === 0) return position;
    if (area < bestArea) {
      best = position;
      bestArea = area;
    }
  }
  return best;
}

/** Candidates tried by avoidElements: the component's own positions first, then beside the trigger. */
export function avoidCandidates(base: readonly ConnectedPosition[]): ConnectedPosition[] {
  return [...base, ...INT_SIDE_POSITIONS];
}

/** Size of the visible viewport (without the scrollbar), the space a panel may use. */
export function viewportSize(document: Document): { width: number; height: number } {
  return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
}

/** Below / above the trigger without offset: panels placed by hand add the gap with their CSS margin. */
const FLUSH_DROPDOWN_POSITIONS: ConnectedPosition[] = INT_DROPDOWN_POSITIONS.map((position) => ({ ...position, offsetY: 0 }));

/**
 * avoidElements for panels placed by hand (absolute, not CDK): the viewport rect where `panel` goes next to
 * `anchor` without covering `avoid`, and on which side of the trigger it ended up. Null when there is nothing to
 * avoid or no candidate fits (the component keeps its own placement).
 */
export function placeAvoiding(
  anchor: HTMLElement,
  panel: HTMLElement,
  avoid: IntAvoidElements | null | undefined,
  document: Document,
): { rect: DOMRect; side: 'below' | 'above' | 'beside' } | null {
  const avoidRects = resolveAvoidRects(avoid, document);
  if (!avoidRects.length) return null;
  const origin = anchor.getBoundingClientRect();
  const size = { width: panel.offsetWidth, height: panel.offsetHeight };
  const chosen = pickAvoidingPosition(avoidCandidates(FLUSH_DROPDOWN_POSITIONS), origin, size, avoidRects, viewportSize(document));
  if (!chosen) return null;
  const rect = rectFor(chosen, origin, size);
  const side = INT_SIDE_POSITIONS.includes(chosen) ? 'beside' : rect.top >= origin.bottom ? 'below' : 'above';
  return { rect, side };
}

/**
 * Wires a component's `avoidElements` input to its `cdkConnectedOverlay`: bind `positions()` to
 * `cdkConnectedOverlayPositions`, call `onAttach()` from `(attach)` and `reset()` when the panel closes.
 * On attach it measures the panel, picks the first position that does not cover the elements and moves
 * it to the front, so the CDK keeps using it (also on scroll) and keeps the rest as fallbacks.
 * Call it in an injection context.
 */
export function avoidOverlayElements(config: {
  avoid: () => IntAvoidElements | null | undefined;
  positions: () => readonly ConnectedPosition[];
  overlay: () => CdkConnectedOverlay | undefined;
  origin: () => HTMLElement | undefined;
}): { positions: Signal<ConnectedPosition[]>; onAttach: () => void; reset: () => void } {
  const document = inject(DOCUMENT);
  const injector = inject(Injector);
  const override = signal<ConnectedPosition[] | null>(null);
  const positions = computed(() => override() ?? [...config.positions()]);

  const onAttach = (): void => {
    if (!config.avoid()) return;
    afterNextRender(
      () => {
        const ref = config.overlay()?.overlayRef;
        const origin = config.origin();
        if (!ref?.hasAttached() || !origin) return;
        const avoid = resolveAvoidRects(config.avoid(), document);
        if (!avoid.length) return;
        const pane = ref.overlayElement;
        const candidates = avoidCandidates(config.positions());
        const size = { width: pane.offsetWidth, height: pane.offsetHeight };
        const chosen = pickAvoidingPosition(candidates, origin.getBoundingClientRect(), size, avoid, viewportSize(document));
        if (!chosen) return;
        const ordered = [chosen, ...candidates.filter((position) => position !== chosen)];
        override.set(ordered);
        const strategy = ref.getConfig().positionStrategy;
        if (strategy instanceof FlexibleConnectedPositionStrategy) strategy.withPositions(ordered).apply();
      },
      { injector },
    );
  };

  return { positions, onAttach, reset: () => override.set(null) };
}
