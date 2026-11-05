import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

/** Option of rowsPerPageOptions: a number, or { showAll: 'All' } to add an option with every record. */
export type IntPaginatorRowsPerPageOption = number | { showAll: string };

/** Payload of onPageChange: same shape as PrimeNG's PaginatorState emitted on change. */
export interface IntPaginatorPageChangeEvent {
  page: number;
  first: number;
  rows: number;
  pageCount: number;
}

/** State passed to templateLeft / templateRight as $implicit: same as PrimeNG's paginatorState. */
export interface IntPaginatorState extends IntPaginatorPageChangeEvent {
  totalRecords: number;
}

/** Context of templateLeft / templateRight. */
export interface IntPaginatorTemplateContext {
  $implicit: IntPaginatorState;
}

/** Label/value pair of the selects (same items PrimeNG passes to its p-select). */
interface IntPaginatorOption {
  label: string;
  value: number;
}

/** Which provisional select is open: rows per page or jump to page. */
type IntPaginatorDropdown = 'rpp' | 'jtp';

let nextId = 0;

/**
 * <int-paginator> · version 1. Replica of PrimeNG v20 p-paginator without PrimeNG at runtime.
 * Navigation buttons (first, prev, pages, next, last), current page report, jump to page and rows per
 * page. The selects and the number input are provisional until dropdown-select and input are done.
 */
@Component({
  selector: 'int-paginator',
  templateUrl: './paginator.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-paginator puts its root class and display on the host element.
  host: {
    class: 'int-paginator',
    '[style.display]': 'display()',
    '[class.int-paginator--disabled]': 'disabled()',    // TODO(dep:dropdown-select provisional) a press outside the open list closes it.
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class IntPaginator {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Cantidad de enlaces de página que se muestran. */
  readonly pageLinkSize = input(5, { transform: numberAttribute });
  /** Muestra el paginador aunque haya una sola página. */
  readonly alwaysShow = input(true, { transform: booleanAttribute });
  /** Template a la izquierda del paginador; recibe el estado del paginador como `$implicit`. */
  readonly templateLeft = input<TemplateRef<IntPaginatorTemplateContext>>();
  /** Template a la derecha del paginador; recibe el estado del paginador como `$implicit`. */
  readonly templateRight = input<TemplateRef<IntPaginatorTemplateContext>>();
  /**
   * Texto del reporte de página actual. Admite `{currentPage}`, `{totalPages}`, `{rows}`, `{first}`,
   * `{last}` y `{totalRecords}`.
   */
  readonly currentPageReportTemplate = input('{currentPage} of {totalPages}');
  /** Muestra el reporte de página actual. */
  readonly showCurrentPageReport = input(false, { transform: booleanAttribute });
  /** Muestra los botones de primera y última página. */
  readonly showFirstLastIcon = input(true, { transform: booleanAttribute });
  /** Cantidad total de registros. */
  readonly totalRecords = input(0, { transform: numberAttribute });
  /** Cantidad de registros por página. */
  readonly rows = input(0, { transform: numberAttribute });
  /**
   * Opciones del selector de filas por página. Un objeto con `showAll` agrega una opción con todos los
   * registros, p. ej. `[10, 20, 30, { showAll: 'All' }]`.
   */
  readonly rowsPerPageOptions = input<readonly IntPaginatorRowsPerPageOption[]>();
  /** Alto máximo de la lista de los selectores; si las opciones no caben, la lista hace scroll. */
  readonly dropdownScrollHeight = input('200px');
  /** Muestra un selector para saltar a cualquier página. */
  readonly showJumpToPageDropdown = input(false, { transform: booleanAttribute });
  /** Muestra un campo numérico para saltar a cualquier página. */
  readonly showJumpToPageInput = input(false, { transform: booleanAttribute });
  /** Muestra los enlaces de página. */
  readonly showPageLinks = input(true, { transform: booleanAttribute });
  /** Locale con el que se formatean los números de página. */
  readonly locale = input<string>();
  /** Índice (desde 0) del primer registro que se muestra. */
  readonly first = input(0, { transform: numberAttribute });
  /** int-* extension: efecto ripple al pulsar los botones. PrimeNG lo activa de forma global con `providePrimeNG({ ripple })`. */
  readonly ripple = input(true, { transform: booleanAttribute });
  /**
   * int-* extension: deshabilita todo el paginador: botones, enlaces de página, selectores y campo de
   * página en gris, sin foco con `Tab` y sin emitir `onPageChange`. PrimeNG solo lo deshabilita cuando no
   * hay páginas.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Se emite al cambiar de página, con el estado nuevo (`page`, `first`, `rows`, `pageCount`). */
  readonly onPageChange = output<IntPaginatorPageChangeEvent>();

  // Templates by reference, same names as PrimeNG.
  /** Reemplaza el icono del botón de primera página. */
  protected readonly firstPageLinkIconTemplate = contentChild<TemplateRef<unknown>>('firstpagelinkicon');
  /** Reemplaza el icono del botón de página anterior. */
  protected readonly previousPageLinkIconTemplate = contentChild<TemplateRef<unknown>>('previouspagelinkicon');
  /** Reemplaza el icono del botón de página siguiente. */
  protected readonly nextPageLinkIconTemplate = contentChild<TemplateRef<unknown>>('nextpagelinkicon');
  /** Reemplaza el icono del botón de última página. */
  protected readonly lastPageLinkIconTemplate = contentChild<TemplateRef<unknown>>('lastpagelinkicon');

  /** Current offset: follows the first input and changes on navigation, like PrimeNG's _first. */
  private readonly firstState = linkedSignal(() => this.first());
  /** Current page size: follows the rows input and changes with the rows per page select. */
  protected readonly rowsState = linkedSignal(() => this.rows());

  protected readonly pageCount = computed(() => {
    const rows = this.rowsState();
    return rows > 0 ? Math.ceil(this.totalRecords() / rows) : 0;
  });
  protected readonly page = computed(() => {
    const rows = this.rowsState();
    return rows > 0 ? Math.floor(this.firstState() / rows) : 0;
  });
  protected readonly empty = computed(() => this.pageCount() === 0);
  /** Controls are off when the paginator is disabled or, as in PrimeNG, when there are no pages. */
  protected readonly inactive = computed(() => this.disabled() || this.empty());
  protected readonly isFirstPage = computed(() => this.page() === 0);
  protected readonly isLastPage = computed(() => this.page() === this.pageCount() - 1);
  /** Page shown in the jump to page input: 0 when there are no pages, as in PrimeNG. */
  protected readonly currentPage = computed(() => (this.pageCount() > 0 ? this.page() + 1 : 0));

  /** Same as PrimeNG calculatePageLinkBoundaries: keeps the current page in the middle when possible. */
  protected readonly pageLinks = computed(() => {
    const numberOfPages = this.pageCount();
    const visiblePages = Math.min(this.pageLinkSize(), numberOfPages);
    let start = Math.max(0, Math.ceil(this.page() - visiblePages / 2));
    const end = Math.min(numberOfPages - 1, start + visiblePages - 1);
    const delta = this.pageLinkSize() - (end - start + 1);
    start = Math.max(0, start - delta);
    // value: zero-based page; label: its 1-based number in the locale digits.
    const links: IntPaginatorOption[] = [];
    for (let i = start; i <= end; i++) links.push({ label: this.localize(i + 1), value: i });
    return links;
  });

  protected readonly pageItems = computed<IntPaginatorOption[]>(() =>
    Array.from({ length: this.pageCount() }, (_, i) => ({ label: String(i + 1), value: i })),
  );

  /** Same as PrimeNG updateRowsPerPageOptions: the showAll option goes last with totalRecords as value. */
  protected readonly rowsPerPageItems = computed<IntPaginatorOption[]>(() => {
    const items: IntPaginatorOption[] = [];
    let showAll: IntPaginatorOption | null = null;
    for (const option of this.rowsPerPageOptions() ?? []) {
      if (typeof option === 'object') {
        if (option.showAll) showAll = { label: option.showAll, value: this.totalRecords() };
      } else {
        items.push({ label: this.localize(option), value: option });
      }
    }
    return showAll ? [...items, showAll] : items;
  });

  protected readonly state = computed<IntPaginatorState>(() => ({
    page: this.page(),
    pageCount: this.pageCount(),
    rows: this.rowsState(),
    first: this.firstState(),
    totalRecords: this.totalRecords(),
  }));

  protected readonly currentPageReport = computed(() => {
    const first = this.firstState();
    const total = this.totalRecords();
    return this.currentPageReportTemplate()
      .replace('{currentPage}', String(this.currentPage()))
      .replace('{totalPages}', String(this.pageCount()))
      .replace('{first}', String(total > 0 ? first + 1 : 0))
      .replace('{last}', String(Math.min(first + this.rowsState(), total)))
      .replace('{rows}', String(this.rowsState()))
      .replace('{totalRecords}', String(total));
  });

  /** Same as PrimeNG display: hidden when alwaysShow is off and there is a single page. */
  protected readonly display = computed(() => (this.alwaysShow() || this.pageLinks().length > 1 ? null : 'none'));

  /** Digits of the locale, indexed by value (same trick as PrimeNG getLocalization). */
  private readonly numerals = computed(() => {
    const digits = [...new Intl.NumberFormat(this.locale(), { useGrouping: false }).format(9876543210)].reverse();
    return new Map(digits.map((digit, i) => [i, digit]));
  });

  constructor() {
    // Same as PrimeNG updateFirst: when totalRecords shrinks below the offset, go back one page.
    effect(() => {
      const total = this.totalRecords();
      untracked(() => {
        const page = this.page();
        if (page > 0 && total && this.firstState() >= total) queueMicrotask(() => this.changePage(page - 1));
      });
    });
  }

  private localize(value: number): string {
    const numerals = this.numerals();
    return String(value)
      .split('')
      .map((digit) => numerals.get(Number(digit)) ?? digit)
      .join('');
  }

  /** Same as PrimeNG changePage: ignores pages out of range, then updates the offset and emits. */
  protected changePage(page: number): void {
    const pageCount = this.pageCount();
    if (this.disabled() || page < 0 || page >= pageCount) return;
    this.firstState.set(this.rowsState() * page);
    this.onPageChange.emit({ page, first: this.firstState(), rows: this.rowsState(), pageCount });
  }

  protected onJumpToPageInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    if (!Number.isNaN(value)) this.changePage(value - 1);
  }

  /** Same as PrimeNG onRppChange: new page size, then the page that contains the current offset. */
  private onRppChange(rows: number): void {
    this.rowsState.set(rows);
    this.changePage(this.page());
  }

  // --- TODO(dep:dropdown-select provisional) rows per page and jump to page selects ---
  // Same keys as p-select: the trigger is a combobox, the list a listbox that opens upwards.
  /** Unique prefix for the ids that link each trigger with its list (aria-controls). */
  protected readonly uid = `int-paginator-${nextId++}`;
  protected readonly openDropdown = signal<IntPaginatorDropdown | null>(null);
  protected readonly rowsLabel = computed(
    () => this.rowsPerPageItems().find((item) => item.value === this.rowsState())?.label ?? String(this.rowsState()),
  );

  protected toggleDropdown(key: IntPaginatorDropdown): void {
    if (this.inactive()) return;
    this.openDropdown.update((open) => (open === key ? null : key));
  }

  /** Enter, Space and the arrows open the list and focus its first option; Escape closes it. */
  protected onTriggerKeydown(event: KeyboardEvent, key: IntPaginatorDropdown): void {
    if (this.inactive()) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.openDropdown.set(key);
      // The list is created in this change detection; focus once it is in the DOM.
      queueMicrotask(() => this.options()[0]?.focus());
    } else if (event.key === 'Escape') {
      this.openDropdown.set(null);
    }
  }

  /** Arrows move between options (wrapping), Home/End go to the ends, Escape closes and Tab leaves. */
  protected onListKeydown(event: KeyboardEvent, trigger: HTMLElement): void {
    const options = this.options();
    const current = options.indexOf(event.target as HTMLElement);
    const focus = (index: number): void => {
      event.preventDefault();
      options.at(index)?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return focus((current + 1) % options.length);
      case 'ArrowUp':
        return focus((current - 1 + options.length) % options.length);
      case 'Home':
        return focus(0);
      case 'End':
        return focus(-1);
      case 'Escape':
        event.preventDefault();
        return this.closeDropdown(trigger);
      case 'Tab':
        return this.openDropdown.set(null);
    }
  }

  protected selectOption(key: IntPaginatorDropdown, value: number, trigger: HTMLElement): void {
    if (key === 'rpp') this.onRppChange(value);
    else this.changePage(value);
    this.closeDropdown(trigger);
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openDropdown()) return;
    const open = this.host.nativeElement.querySelector('.int-paginator__dropdown--open');
    if (!open?.contains(event.target as Node)) this.openDropdown.set(null);
  }

  private closeDropdown(trigger: HTMLElement): void {
    this.openDropdown.set(null);
    trigger.focus();
  }

  private options(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>('.int-paginator__dropdown-option')];
  }

  // --- Ripple (PrimeNG puts its ripple directive on every navigation and page button) ---
  /** Ink at the press point, sized to the longest side of the button; removed when it ends. */
  protected onPointerDown(event: PointerEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    if (!this.ripple() || button.disabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement('span');
    ink.className = 'int-paginator__ink int-paginator__ink--active';
    ink.setAttribute('aria-hidden', 'true');
    ink.style.inlineSize = ink.style.blockSize = `${size}px`;
    ink.style.insetInlineStart = `${event.clientX - rect.left - size / 2}px`;
    ink.style.insetBlockStart = `${event.clientY - rect.top - size / 2}px`;
    ink.addEventListener('animationend', () => ink.remove(), { once: true });
    button.appendChild(ink);
  }
}
