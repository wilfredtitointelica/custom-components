import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, DestroyRef, effect,
  ElementRef, inject, input, linkedSignal, numberAttribute, output, signal, TemplateRef, untracked, viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** int-* extension: visual format of the knowledge base (.prCarousel--more: compact arrows and counter below). */
export type IntCarouselAppearance = 'more';

/** One entry of responsiveOptions, same shape as PrimeNG CarouselResponsiveOptions. */
export interface IntCarouselResponsiveOptions {
  /** Max width of the screen, e.g. '768px'. */
  breakpoint: string;
  numVisible: number;
  numScroll: number;
}

/** Payload of onPage, same shape as PrimeNG CarouselPageEvent. */
export interface IntCarouselPageEvent {
  page: number;
}

/** Context of the #item template. */
export interface IntCarouselItemContext<T> {
  $implicit: T;
}

let nextId = 0;

/**
 * <int-carousel> · version 1. Replica of PrimeNG v20 p-carousel without PrimeNG at runtime.
 * Carousel is a content slider featuring various customization options. The position lives in signals
 * (totalShifted → transform) instead of writing the style of the track, and the width of each item comes from
 * numVisible instead of an injected <style>. The knowledge base .prCarousel--more is appearance="more"; --nav is
 * showNavigators / showIndicators set to false. Left out because neither the knowledge base nor Figma
 * shows them: orientation / verticalViewPortHeight (vertical) and circular / autoplayInterval. The side navigators
 * show only the icon as Figma: the knowledge base gradient behind them is left out for now.
 */
@Component({
  selector: 'int-carousel',
  templateUrl: './carousel.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-carousel puts its root classes, the id and role="region" on the host.
  host: { '[class]': 'classes()', '[attr.id]': 'id', role: 'region' },
})
export class IntCarousel<T = unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Elementos que se muestran en el carousel. */
  readonly value = input<T[] | null | undefined>(null);
  /** Índice de la página que se muestra; al cambiarlo, el carousel se desplaza a esa página. */
  readonly page = input(0, { transform: numberAttribute });
  /** Cantidad de elementos visibles por página. */
  readonly numVisible = input(1, { transform: numberAttribute });
  /** Cantidad de elementos que avanza cada desplazamiento. */
  readonly numScroll = input(1, { transform: numberAttribute });
  /** Opciones responsive: numVisible y numScroll por ancho máximo de pantalla. */
  readonly responsiveOptions = input<IntCarouselResponsiveOptions[]>();
  /** Clase extra del contenedor del contenido. */
  readonly contentClass = input('');
  /** Clase extra de la lista de indicadores. */
  readonly indicatorsContentClass = input('');
  /** Estilos inline de la lista de indicadores. */
  readonly indicatorsContentStyle = input<Record<string, string> | null>();
  /** Clase extra de cada indicador. */
  readonly indicatorStyleClass = input('');
  /** Estilos inline de cada indicador. */
  readonly indicatorStyle = input<Record<string, string> | null>();
  /** Muestra los indicadores de página. */
  readonly showIndicators = input(true, { transform: booleanAttribute });
  /** Muestra los botones de anterior y siguiente. */
  readonly showNavigators = input(true, { transform: booleanAttribute });
  /**
   * int-* extension: formato visual. 'more' muestra flechas compactas y un contador debajo del contenido, sin
   * indicadores (.prCarousel--more de la base de conocimientos).
   */
  readonly appearance = input<IntCarouselAppearance>();
  /** int-* extension: texto del contador del formato 'more'; {page} y {total} se reemplazan. */
  readonly counterFormat = input('{page} of {total}');
  /** int-* extension: etiqueta accesible del botón anterior (en PrimeNG sale de las traducciones globales). */
  readonly prevButtonAriaLabel = input('Previous Page');
  /** int-* extension: etiqueta accesible del botón siguiente (en PrimeNG sale de las traducciones globales). */
  readonly nextButtonAriaLabel = input('Next Page');
  /** int-* extension: descripción del rol de cada elemento (en PrimeNG sale de las traducciones globales). */
  readonly slideAriaLabel = input('Slide');
  /** int-* extension: etiqueta accesible de cada indicador; {page} se reemplaza por el número. */
  readonly pageAriaLabel = input('Page {page}');

  /** Se emite al cambiar de página, con { page }. */
  readonly onPage = output<IntCarouselPageEvent>();

  /** Template #item: contenido de cada elemento; recibe { $implicit: item }. */
  protected readonly itemTemplate = contentChild<TemplateRef<IntCarouselItemContext<T>>>('item');
  /** Template #header: contenido arriba del carousel. */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Template #footer: contenido debajo del carousel. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** Template #previousicon: reemplaza el ícono del botón anterior. */
  protected readonly previousIconTemplate = contentChild<TemplateRef<unknown>>('previousicon');
  /** Template #nexticon: reemplaza el ícono del botón siguiente. */
  protected readonly nextIconTemplate = contentChild<TemplateRef<unknown>>('nexticon');

  private readonly indicatorButtons = viewChildren<ElementRef<HTMLButtonElement>>('indicatorButton');

  readonly id = `int-carousel-${nextId++}`;

  /** Window width, only tracked when responsiveOptions is set. */
  private readonly windowWidth = signal(typeof window === 'undefined' ? 0 : window.innerWidth);
  /** Breakpoint that applies, same rule as PrimeNG calculatePosition (the smallest one that still fits). */
  private readonly responsive = computed(() => {
    const options = this.responsiveOptions();
    if (!options?.length) return null;
    const sorted = [...options].sort((a, b) => parseInt(b.breakpoint, 10) - parseInt(a.breakpoint, 10));
    let match: IntCarouselResponsiveOptions | null = null;
    for (const option of sorted) if (parseInt(option.breakpoint, 10) >= this.windowWidth()) match = option;
    return match;
  });
  protected readonly visible = computed(() => this.responsive()?.numVisible ?? this.numVisible());
  private readonly scroll = computed(() => this.responsive()?.numScroll ?? this.numScroll());

  private readonly items = computed(() => this.value() ?? []);
  protected readonly isEmpty = computed(() => this.items().length === 0);
  protected readonly isMore = computed(() => this.appearance() === 'more');

  /** Active page and items shifted (negative), the same two numbers PrimeNG keeps. */
  protected readonly currentPage = signal(0);
  private readonly totalShifted = signal(0);
  /** true while the track animates; the transition only applies then (PrimeNG sets it per step). */
  protected readonly animating = signal(false);
  private remainingItems = 0;
  private isRemainingItemsAdded = false;

  protected readonly totalDots = computed(() => {
    const length = this.items().length;
    return length ? Math.ceil((length - this.visible()) / this.scroll()) + 1 : 0;
  });
  protected readonly dots = computed(() => Array.from({ length: Math.max(this.totalDots(), 0) }, (_, i) => i));
  protected readonly firstIndex = computed(() => -1 * this.totalShifted());
  protected readonly lastIndex = computed(() => this.firstIndex() + this.visible() - 1);
  protected readonly isForwardNavDisabled = computed(
    () => this.isEmpty() || this.currentPage() >= this.totalDots() - 1,
  );
  protected readonly isBackwardNavDisabled = computed(() => this.isEmpty() || this.currentPage() <= 0);

  protected readonly trackTransform = computed(
    () => `translate3d(${this.totalShifted() * (100 / this.visible())}%, 0, 0)`,
  );
  /** flex of each item: PrimeNG writes it in an injected <style> per numVisible. */
  protected readonly itemFlex = computed(() => `1 0 ${100 / this.visible()}%`);
  protected readonly counter = computed(() =>
    this.counterFormat()
      .replace(/{page}/g, String(this.currentPage() + 1))
      .replace(/{total}/g, String(this.totalDots())),
  );

  /** Indicator with tabindex 0 (roving tabindex); follows the active page. */
  protected readonly focusedIndicator = linkedSignal(() => this.currentPage());

  private startPos = 0;
  private readonly swipeThreshold = 20;
  private created = false;

  protected readonly classes = computed(() => (this.isMore() ? 'int-carousel int-carousel--more' : 'int-carousel'));

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Same as PrimeNG onAfterContentChecked: when the items, numVisible or numScroll change, clamp the page and
    // place the track there without animation.
    effect(() => {
      const length = this.items().length;
      const visible = this.visible();
      const scroll = this.scroll();
      untracked(() => {
        this.remainingItems = (length - visible) % scroll;
        let page = this.created ? this.currentPage() : this.page();
        const dots = this.totalDots();
        if (dots !== 0 && page >= dots) page = dots - 1;
        let total = page * scroll * -1;
        if (page === dots - 1 && this.remainingItems > 0) {
          total += -1 * this.remainingItems + scroll;
          this.isRemainingItemsAdded = true;
        } else {
          this.isRemainingItemsAdded = false;
        }
        if (this.created && page !== this.currentPage()) this.onPage.emit({ page });
        this.animating.set(false);
        this.currentPage.set(page);
        this.totalShifted.set(total);
        this.created = true;
      });
    });

    // Same as PrimeNG page setter: a new page from the input scrolls there.
    effect(() => {
      const page = this.page();
      untracked(() => {
        if (!this.created || page === this.currentPage()) return;
        if (page > this.currentPage() && page <= this.totalDots() - 1) this.step(-1, page);
        else if (page < this.currentPage()) this.step(1, page);
      });
    });

    // responsiveOptions needs the window width (PrimeNG bindDocumentListeners).
    if (typeof window !== 'undefined') {
      const onResize = () => {
        if (this.responsiveOptions()?.length) this.windowWidth.set(window.innerWidth);
      };
      window.addEventListener('resize', onResize);
      destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    }
  }

  /** Avanza una página (o va a la página indicada). */
  navForward(event?: Event, index?: number): void {
    if (this.currentPage() < this.totalDots() - 1) this.step(-1, index);
    if (event?.cancelable) event.preventDefault();
  }

  /** Retrocede una página (o va a la página indicada). */
  navBackward(event?: Event, index?: number): void {
    if (this.currentPage() !== 0) this.step(1, index);
    if (event?.cancelable) event.preventDefault();
  }

  protected onDotClick(event: Event, index: number): void {
    const page = this.currentPage();
    if (index > page) this.navForward(event, index);
    else if (index < page) this.navBackward(event, index);
  }

  /** Same as PrimeNG onIndicatorKeydown: only the arrows move the focus between indicators. */
  protected onIndicatorKeydown(event: KeyboardEvent): void {
    const last = this.totalDots() - 1;
    const current = this.focusedIndicator();
    if (event.code === 'ArrowRight') this.focusIndicator(current + 1 > last ? last : current + 1);
    else if (event.code === 'ArrowLeft') this.focusIndicator(current - 1 <= 0 ? 0 : current - 1);
  }

  private focusIndicator(index: number): void {
    this.focusedIndicator.set(index);
    this.indicatorButtons()[index]?.nativeElement.focus();
  }

  /** Same as PrimeNG step: moves the track by numScroll (dir -1 forward, 1 backward) or to a page. */
  private step(dir: 1 | -1, page?: number): void {
    const scroll = this.scroll();
    const dots = this.totalDots();
    let total = this.totalShifted();
    let target: number;
    if (page != null) {
      total = scroll * page * -1;
      this.isRemainingItemsAdded = false;
      target = page;
    } else {
      total += scroll * dir;
      if (this.isRemainingItemsAdded) {
        total += this.remainingItems - scroll * dir;
        this.isRemainingItemsAdded = false;
      }
      target = Math.abs(Math.floor(total / scroll));
    }
    if (target === dots - 1 && this.remainingItems > 0) {
      total += this.remainingItems * -1 - scroll * dir;
      this.isRemainingItemsAdded = true;
    }
    this.animating.set(true);
    this.totalShifted.set(total);
    this.currentPage.set(target);
    this.onPage.emit({ page: target });
  }

  /** The transition only applies while a step animates (PrimeNG clears it on transitionend). */
  protected onTransitionEnd(event: TransitionEvent): void {
    // transitionend bubbles from the content of the items: only the track's own transform counts.
    if (event.target !== event.currentTarget) return;
    this.animating.set(false);
  }

  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.startPos = touch.pageX;
  }

  protected onTouchMove(event: TouchEvent): void {
    if (event.cancelable) event.preventDefault();
  }

  protected onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const diff = touch.pageX - this.startPos;
    if (Math.abs(diff) > this.swipeThreshold) {
      if (diff < 0) this.navForward(event);
      else this.navBackward(event);
    }
  }

  protected isItemActive(index: number): boolean {
    return this.firstIndex() <= index && this.lastIndex() >= index;
  }

  protected pageLabel(index: number): string {
    return this.pageAriaLabel().replace(/{page}/g, String(index + 1));
  }
}
