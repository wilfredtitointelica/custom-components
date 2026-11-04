import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { IsActiveMatchOptions, Params, QueryParamsHandling, RouterLink, RouterLinkActive } from '@angular/router';

/** Item of the trail: the MenuItem fields that p-breadcrumb reads, plus `items` (int-* extension). */
export interface IntBreadcrumbItem {
  /** Texto del item. */
  label?: string;
  /** Clase del icono que va antes del texto (p. ej. `icon icon-file`). */
  icon?: string;
  /** Clase adicional del icono. */
  iconClass?: string;
  /** Estilo en línea del icono. */
  iconStyle?: Record<string, string>;
  /** Enlace externo o interno (`href`). */
  url?: string;
  /** Ruta de Angular; con ella el enlace usa `routerLink`. */
  routerLink?: string | readonly unknown[];
  queryParams?: Params;
  fragment?: string;
  queryParamsHandling?: QueryParamsHandling;
  preserveFragment?: boolean;
  skipLocationChange?: boolean;
  replaceUrl?: boolean;
  state?: Record<string, unknown>;
  routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions;
  /** Destino del enlace (`_blank`…). */
  target?: string;
  /** Texto del atributo `title`. */
  title?: string;
  /** Deshabilita el item: no navega ni ejecuta `command`. */
  disabled?: boolean;
  /** Con `false` el item (y su separador) no se muestra. */
  visible?: boolean;
  /** Se ejecuta al hacer clic en el item. */
  command?: (event: IntBreadcrumbItemCommandEvent) => void;
  /** `id` del `<li>`. */
  id?: string;
  /** Clase adicional del `<li>`. */
  styleClass?: string;
  /** Estilo en línea del `<li>`. */
  style?: Record<string, string>;
  /** `tabindex` del enlace (por defecto `0`). */
  tabindex?: string;
  /** Con `false` el texto se pinta como HTML. */
  escape?: boolean;
  /** Valor de `data-p-id`, para pruebas automatizadas. */
  automationId?: string;
  /**
   * int-* extension: enlaces colapsados. El item se muestra como una pastilla `…` (o su `label`) que abre
   * la lista de estos enlaces.
   */
  items?: readonly IntBreadcrumbItem[];
}

/** Payload of `command` and `onItemClick`: same shape as PrimeNG's BreadcrumbItemClickEvent. */
export interface IntBreadcrumbItemClickEvent {
  originalEvent: Event;
  item: IntBreadcrumbItem;
}

/** Payload of an item's `command`. */
export type IntBreadcrumbItemCommandEvent = IntBreadcrumbItemClickEvent;

/** Context of the item template: the item as `$implicit`. */
export interface IntBreadcrumbItemTemplateContext {
  $implicit: IntBreadcrumbItem;
}

/**
 * <int-breadcrumb> · version 1. Replica of PrimeNG v20 p-breadcrumb without PrimeNG at runtime.
 * A nav > ol trail: optional home item, the model items and a separator between them; the last item is
 * the current page.
 */
@Component({
  selector: 'int-breadcrumb',
  templateUrl: './breadcrumb.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: the <nav> of the template carries the block, the host does not render a box.
  host: {
    style: 'display: contents',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class IntBreadcrumb {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Lista de items del recorrido; el último es la página actual. */
  readonly model = input<readonly IntBreadcrumbItem[]>();
  /** Item de inicio, antes del `model`; sin `icon` muestra el icono de casa. */
  readonly home = input<IntBreadcrumbItem>();
  /** Etiqueta accesible del item de inicio. */
  readonly homeAriaLabel = input<string>();
  /** Estilo en línea del componente. */
  readonly style = input<Record<string, string> | null>(null);
  /** Clase adicional del componente. */
  readonly styleClass = input<string>();
  /**
   * int-* extension: deshabilita todo el breadcrumb: items, separadores y pastillas en gris, sin foco con
   * `Tab` y sin navegar, ejecutar `command` ni emitir `onItemClick`. Para un solo item se usa su campo `disabled`.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Se emite al hacer clic en un item que no está deshabilitado. */
  readonly onItemClick = output<IntBreadcrumbItemClickEvent>();

  // Templates by reference, same names as PrimeNG.
  /** Reemplaza el contenido de cada item (también el de inicio); recibe el item como `$implicit`. */
  protected readonly itemTemplate = contentChild<TemplateRef<IntBreadcrumbItemTemplateContext>>('item');
  /** Reemplaza el icono de los separadores. */
  protected readonly separatorTemplate = contentChild<TemplateRef<unknown>>('separator');

  /** int-* extension: collapsed item whose list is open (one at a time). */
  protected readonly expanded = signal<IntBreadcrumbItem | null>(null);
  /** Block class, disabled modifier and the consumer's styleClass, on the <nav> as in PrimeNG. */
  protected readonly classes = computed(() =>
    ['int-breadcrumb', this.disabled() && 'int-breadcrumb--disabled', this.styleClass()].filter(Boolean).join(' '),
  );
  /** Unique prefix for the ids that link each trigger with its list (aria-controls). */
  protected readonly uid = `int-breadcrumb-${nextId++}`;

  /** Same as PrimeNG onClick: disabled items do nothing; items without a link do not navigate. */
  protected onClick(event: Event, item: IntBreadcrumbItem): void {
    if (this.disabled() || item.disabled) {
      event.preventDefault();
      return;
    }
    if (!item.url && !item.routerLink) {
      event.preventDefault();
    }
    item.command?.({ originalEvent: event, item });
    this.onItemClick.emit({ originalEvent: event, item });
  }

  // --- int-* extension: collapsed items (the knowledge base "…" pill) ---

  protected toggle(item: IntBreadcrumbItem): void {
    if (this.disabled() || item.disabled) return;
    this.expanded.update((open) => (open === item ? null : item));
  }

  /** A link of the list: same click as any item, then the list closes and the trigger gets the focus. */
  protected onPanelClick(event: Event, item: IntBreadcrumbItem, trigger: HTMLElement): void {
    this.onClick(event, item);
    if (!item.disabled) this.close(trigger);
  }

  /** Menu button pattern: ArrowDown/Up open the list and focus its first/last link. */
  protected onTriggerKeydown(event: KeyboardEvent, item: IntBreadcrumbItem, panelId: string): void {
    if (this.disabled() || item.disabled || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    this.expanded.set(item);
    const last = event.key === 'ArrowUp';
    // The list is created in this change detection; focus once it is in the DOM.
    queueMicrotask(() => this.focusLink(panelId, last ? -1 : 0));
  }

  /** Arrows move between links (wrapping), Home/End go to the ends, Escape and Tab close. */
  protected onPanelKeydown(event: KeyboardEvent, panelId: string, trigger: HTMLElement): void {
    const links = this.links(panelId);
    const current = links.indexOf(event.target as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusLink(panelId, (current + 1) % links.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusLink(panelId, (current - 1 + links.length) % links.length);
        break;
      case 'Home':
        event.preventDefault();
        this.focusLink(panelId, 0);
        break;
      case 'End':
        event.preventDefault();
        this.focusLink(panelId, -1);
        break;
      case 'Escape':
        event.preventDefault();
        this.close(trigger);
        break;
      case 'Tab':
        this.expanded.set(null);
        break;
    }
  }

  /** Escape on the trigger closes the list too. */
  protected onTriggerEscape(trigger: HTMLElement): void {
    if (this.expanded()) this.close(trigger);
  }

  /** A press outside the open item closes its list. */
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.expanded()) return;
    const open = this.host.nativeElement.querySelector('.int-breadcrumb__item--expanded');
    if (!open?.contains(event.target as Node)) this.expanded.set(null);
  }

  private close(trigger: HTMLElement): void {
    this.expanded.set(null);
    trigger.focus();
  }

  private links(panelId: string): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(`#${panelId} .int-breadcrumb__panel-link:not([aria-disabled="true"])`),
    );
  }

  private focusLink(panelId: string, index: number): void {
    this.links(panelId).at(index)?.focus();
  }
}

let nextId = 0;
