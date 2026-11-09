import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, input, model, output, signal,
  TemplateRef, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
// CDK drag-drop, as PrimeNG p-picklist uses it for dragdrop: connected lists, sorting, preview and placeholder.
import {
  CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup,
} from '@angular/cdk/drag-drop';

/** List an item belongs to. */
export type IntPickListList = 'source' | 'target';

/** Text match used by the filter, same values as PrimeNG filterMatchMode for text. */
export type IntPickListFilterMatchMode = 'contains' | 'startsWith' | 'endsWith' | 'equals';

/** Payload of the transfer buttons and drops, same shape as PrimeNG PickListMoveToTargetEvent. */
export interface IntPickListMoveEvent<T = unknown> {
  items: T[];
}

/** Payload of onSourceSelect / onTargetSelect, same shape as PrimeNG PickListSourceSelectEvent. */
export interface IntPickListSelectEvent<T = unknown> {
  originalEvent: Event;
  items: T[];
}

/** Payload of onSourceFilter / onTargetFilter, same shape as PrimeNG PickListSourceFilterEvent. */
export interface IntPickListFilterEvent<T = unknown> {
  query: string;
  value: T[];
}

/** Context of the item template. */
export interface IntPickListItemContext<T = unknown> {
  $implicit: T;
  index: number;
  selected: boolean;
}

/**
 * <int-pick-list> · version 1. Replica of PrimeNG v20 p-picklist without PrimeNG at runtime: two lists and the
 * buttons between them to move the selected items, or all of them, from one list to the other; optionally by
 * dragging (dragdrop) and with a filter on top of each list (filterBy).
 */
@Component({
  selector: 'int-pick-list',
  templateUrl: './pick-list.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class IntPickList<T = unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Items de la lista de origen; se actualiza al mover (`[(source)]`). */
  readonly source = model<T[]>([]);
  /** Items de la lista de destino; se actualiza al mover (`[(target)]`). */
  readonly target = model<T[]>([]);
  /** Título de la lista de origen. */
  readonly sourceHeader = input<string>();
  /** Título de la lista de destino. */
  readonly targetHeader = input<string>();
  /**
   * Alto de cada lista; con más items aparece el scroll.
   * @defaultValue '14rem'
   */
  readonly scrollHeight = input('14rem');
  /** Si es `true`, el clic reemplaza la selección y Ctrl/Cmd + clic agrega o quita items. */
  readonly metaKeySelection = input(false, { transform: booleanAttribute });
  /** Si es `true`, los items se pasan de una lista a otra arrastrándolos y se reordenan dentro de cada lista. */
  readonly dragdrop = input(false, { transform: booleanAttribute });
  /** Campos del item en los que busca el filtro, separados por coma (`name` o `name,category`); activa el buscador. */
  readonly filterBy = input<string>();
  /**
   * Muestra el buscador de la lista de origen cuando hay `filterBy`.
   * @defaultValue true
   */
  readonly showSourceFilter = input(true, { transform: booleanAttribute });
  /**
   * Muestra el buscador de la lista de destino cuando hay `filterBy`.
   * @defaultValue true
   */
  readonly showTargetFilter = input(true, { transform: booleanAttribute });
  /**
   * Cómo compara el texto: `contains`, `startsWith`, `endsWith` o `equals`.
   * @defaultValue 'contains'
   */
  readonly filterMatchMode = input<IntPickListFilterMatchMode>('contains');
  /** Idioma con el que se pasan a minúsculas el texto buscado y los valores (`toLocaleLowerCase`). */
  readonly filterLocale = input<string>();
  /** Texto del buscador de la lista de origen. */
  readonly sourceFilterPlaceholder = input<string>();
  /** Texto del buscador de la lista de destino. */
  readonly targetFilterPlaceholder = input<string>();
  /** Etiqueta accesible del buscador de la lista de origen. */
  readonly ariaSourceFilterLabel = input<string>();
  /** Etiqueta accesible del buscador de la lista de destino. */
  readonly ariaTargetFilterLabel = input<string>();
  /**
   * int-* extension: muestra los botones de transferencia del centro (PrimeNG no permite ocultarlos). Con `false`
   * los items solo se mueven arrastrando, así que se usa junto con `dragdrop`; con teclado se pueden seleccionar
   * pero no pasar a la otra lista.
   * @defaultValue true
   */
  readonly showTransferControls = input(true, { transform: booleanAttribute });
  /** Deshabilita la selección, el arrastre y los botones. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Etiqueta accesible del botón que pasa los seleccionados al destino.
   * @defaultValue 'Move to Target'
   */
  readonly rightButtonAriaLabel = input('Move to Target');
  /**
   * Etiqueta accesible del botón que pasa todos los items al destino.
   * @defaultValue 'Move All to Target'
   */
  readonly allRightButtonAriaLabel = input('Move All to Target');
  /**
   * Etiqueta accesible del botón que devuelve los seleccionados al origen.
   * @defaultValue 'Move to Source'
   */
  readonly leftButtonAriaLabel = input('Move to Source');
  /**
   * Etiqueta accesible del botón que devuelve todos los items al origen.
   * @defaultValue 'Move All to Source'
   */
  readonly allLeftButtonAriaLabel = input('Move All to Source');

  /** Se emite al pasar items al destino (botón, doble clic o arrastre). */
  readonly onMoveToTarget = output<IntPickListMoveEvent<T>>();
  /** Se emite al pasar todos los items visibles al destino. */
  readonly onMoveAllToTarget = output<IntPickListMoveEvent<T>>();
  /** Se emite al devolver items al origen (botón, doble clic o arrastre). */
  readonly onMoveToSource = output<IntPickListMoveEvent<T>>();
  /** Se emite al devolver todos los items visibles al origen. */
  readonly onMoveAllToSource = output<IntPickListMoveEvent<T>>();
  /** Se emite al reordenar arrastrando dentro de la lista de origen. */
  readonly onSourceReorder = output<IntPickListMoveEvent<T>>();
  /** Se emite al reordenar arrastrando dentro de la lista de destino. */
  readonly onTargetReorder = output<IntPickListMoveEvent<T>>();
  /** Se emite al cambiar la selección de la lista de origen. */
  readonly onSourceSelect = output<IntPickListSelectEvent<T>>();
  /** Se emite al cambiar la selección de la lista de destino. */
  readonly onTargetSelect = output<IntPickListSelectEvent<T>>();
  /** Se emite al escribir en el buscador de origen, con `query` y los items visibles (`value`). */
  readonly onSourceFilter = output<IntPickListFilterEvent<T>>();
  /** Se emite al escribir en el buscador de destino, con `query` y los items visibles (`value`). */
  readonly onTargetFilter = output<IntPickListFilterEvent<T>>();

  /** Template `item`: contenido de cada item; recibe `{ $implicit: item, index, selected }`. */
  protected readonly itemTemplate = contentChild<TemplateRef<IntPickListItemContext<T>>>('item');

  /** Lists in display order: source on the left, target on the right. */
  protected readonly lists: readonly IntPickListList[] = ['source', 'target'];

  /** Selected items of each list (PrimeNG selectedItemsSource / selectedItemsTarget). */
  protected readonly selection = signal<Record<IntPickListList, T[]>>({ source: [], target: [] });
  /** Item of each list that holds the tab stop (roving tabindex, as the p-listbox options of p-picklist). */
  protected readonly focusedIndex = signal<Record<IntPickListList, number>>({ source: 0, target: 0 });
  /** Normalized filter text of each list (PrimeNG filterValueSource / filterValueTarget). */
  protected readonly filterValue = signal<Record<IntPickListList, string>>({ source: '', target: '' });
  /** List an item is being dragged over: the other items slide to make room only there. */
  protected readonly draggingList = signal<IntPickListList | null>(null);

  /** Items shown in each list: all of them, or those matching the filter (PrimeNG visibleOptionsSource / Target). */
  protected readonly visibleItems = computed<Record<IntPickListList, T[]>>(() => ({
    source: this.filterItems(this.source(), this.filterValue().source),
    target: this.filterItems(this.target(), this.filterValue().target),
  }));

  // Same conditions as PrimeNG moveRightDisabled / moveAllRightDisabled / moveLeftDisabled / moveAllLeftDisabled.
  protected readonly moveRightDisabled = computed(() => this.disabled() || !this.selection().source.length);
  protected readonly moveAllRightDisabled = computed(() => this.disabled() || !this.visibleItems().source.length);
  protected readonly moveLeftDisabled = computed(() => this.disabled() || !this.selection().target.length);
  protected readonly moveAllLeftDisabled = computed(() => this.disabled() || !this.visibleItems().target.length);

  protected readonly classes = computed(() => {
    const classes = ['int-pick-list'];
    if (this.dragdrop() && !this.disabled()) classes.push('int-pick-list--dragdrop');
    if (this.disabled()) classes.push('int-pick-list--disabled');
    return classes.join(' ');
  });

  protected showFilter(list: IntPickListList): boolean {
    return !!this.filterBy() && (list === 'source' ? this.showSourceFilter() : this.showTargetFilter());
  }

  protected isSelected(item: T, list: IntPickListList): boolean {
    return this.selection()[list].includes(item);
  }

  /** PrimeNG onFilter: stores the trimmed, lower-cased text and emits the visible items. */
  protected onFilterInput(event: Event, list: IntPickListList): void {
    const query = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase(this.filterLocale());
    this.filterValue.update((value) => ({ ...value, [list]: query }));
    this.focusedIndex.update((focused) => ({ ...focused, [list]: 0 }));
    const payload = { query, value: this.visibleItems()[list] };
    if (list === 'source') this.onSourceFilter.emit(payload);
    else this.onTargetFilter.emit(payload);
  }

  /** Click on an option: toggles it, or with metaKeySelection replaces the selection unless Ctrl/Cmd is pressed. */
  protected onOptionClick(event: MouseEvent | KeyboardEvent, item: T, list: IntPickListList, index: number): void {
    if (this.disabled()) {
      return;
    }
    const current = this.selection()[list];
    const selected = current.includes(item);
    let items: T[];
    if (this.metaKeySelection() && !(event.metaKey || event.ctrlKey)) {
      items = selected && current.length === 1 ? [] : [item];
    } else {
      items = selected ? current.filter((value) => value !== item) : [...current, item];
    }
    this.setSelection(event, list, items);
    this.focusedIndex.update((focused) => ({ ...focused, [list]: index }));
  }

  /** PrimeNG onSourceItemDblClick / onTargetItemDblClick: the double-clicked item moves to the other list. */
  protected onOptionDblClick(event: MouseEvent, item: T, list: IntPickListList): void {
    if (this.disabled()) {
      return;
    }
    this.setSelection(event, list, [item]);
    if (list === 'source') this.moveRight();
    else this.moveLeft();
  }

  /** Listbox keys of the p-picklist lists: arrows / Home / End move the focus, Enter / Space toggle the item. */
  protected onOptionKeydown(event: KeyboardEvent, item: T, list: IntPickListList, index: number): void {
    if (this.disabled()) {
      return;
    }
    const last = this.visibleItems()[list].length - 1;
    let next: number;
    switch (event.code) {
      case 'ArrowDown':
        next = Math.min(index + 1, last);
        break;
      case 'ArrowUp':
        next = Math.max(index - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        this.onOptionClick(event, item, list, index);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.focusedIndex.update((focused) => ({ ...focused, [list]: next }));
    const options = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="option"]');
    options?.[next].focus();
  }

  /** PrimeNG moveRight: selected items go to the end of the target, in the order they were selected. */
  protected moveRight(): void {
    const items = this.selection().source;
    this.transfer(items, 'source', 'target');
    this.onMoveToTarget.emit({ items });
  }

  /** PrimeNG moveAllRight: only the items the filter leaves visible. */
  protected moveAllRight(): void {
    const items = [...this.visibleItems().source];
    this.transfer(items, 'source', 'target');
    this.onMoveAllToTarget.emit({ items });
  }

  protected moveLeft(): void {
    const items = this.selection().target;
    this.transfer(items, 'target', 'source');
    this.onMoveToSource.emit({ items });
  }

  protected moveAllLeft(): void {
    const items = [...this.visibleItems().target];
    this.transfer(items, 'target', 'source');
    this.onMoveAllToSource.emit({ items });
  }

  protected dragStarted(list: IntPickListList): void {
    this.draggingList.set(list);
  }

  protected dragEnded(): void {
    this.draggingList.set(null);
  }

  protected listEntered(list: IntPickListList): void {
    this.draggingList.set(list);
  }

  /**
   * PrimeNG onDrop. Same list: reorder. Other list: the dragged item moves, or the whole selection of its list when
   * the item is selected, in list order. CDK indexes are positions among the visible items; they are mapped to the
   * full list so a filter does not move items to the wrong place (PrimeNG getDropIndexes).
   */
  protected dropped(event: CdkDragDrop<IntPickListList, IntPickListList, T>): void {
    const from = event.previousContainer.data;
    const to = event.container.data;
    const item = event.item.data;
    this.draggingList.set(null);
    if (from === to) {
      const items = [...this.listItems(to)];
      const visible = this.visibleItems()[to];
      const previousIndex = items.indexOf(item);
      const target = visible[event.currentIndex];
      const currentIndex = target === undefined ? items.length - 1 : items.indexOf(target);
      if (previousIndex === currentIndex) {
        return;
      }
      items.splice(previousIndex, 1);
      items.splice(currentIndex, 0, item);
      this.listModel(to).set(items);
      if (to === 'source') this.onSourceReorder.emit({ items: [item] });
      else this.onTargetReorder.emit({ items: [item] });
      return;
    }
    const selected = this.selection()[from];
    const moving = selected.includes(item)
      ? this.listItems(from).filter((value) => selected.includes(value))
      : [item];
    const destination = this.listItems(to).filter((value) => !moving.includes(value));
    const anchor = this.visibleItems()[to][event.currentIndex];
    const insertAt = anchor === undefined ? destination.length : destination.indexOf(anchor);
    destination.splice(insertAt, 0, ...moving);
    this.listModel(from).set(this.listItems(from).filter((value) => !moving.includes(value)));
    this.listModel(to).set(destination);
    this.selection.set({ source: [], target: [] });
    if (to === 'target') this.onMoveToTarget.emit({ items: moving });
    else this.onMoveToSource.emit({ items: moving });
  }

  private setSelection(event: Event, list: IntPickListList, items: T[]): void {
    this.selection.update((selection) => ({ ...selection, [list]: items }));
    const payload = { originalEvent: event, items };
    if (list === 'source') this.onSourceSelect.emit(payload);
    else this.onTargetSelect.emit(payload);
  }

  /** Moves items between the models and clears both selections, as PrimeNG does after a transfer. */
  private transfer(items: T[], from: IntPickListList, to: IntPickListList): void {
    this.listModel(from).set(this.listItems(from).filter((item) => !items.includes(item)));
    this.listModel(to).set([...this.listItems(to), ...items]);
    this.selection.set({ source: [], target: [] });
    this.focusedIndex.set({ source: 0, target: 0 });
  }

  /** PrimeNG FilterService.filter on the filterBy fields (dot paths allowed) with filterMatchMode. */
  private filterItems(items: T[], query: string): T[] {
    const filterBy = this.filterBy();
    if (!filterBy || !query) {
      return items;
    }
    const fields = filterBy.split(',').map((field) => field.trim());
    const locale = this.filterLocale();
    const mode = this.filterMatchMode();
    return items.filter((item) =>
      fields.some((field) => {
        const raw = field.split('.').reduce<unknown>(
          (value, key) => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
          item,
        );
        if (raw === null || raw === undefined) return false;
        const text = String(raw).toLocaleLowerCase(locale);
        switch (mode) {
          case 'startsWith':
            return text.startsWith(query);
          case 'endsWith':
            return text.endsWith(query);
          case 'equals':
            return text === query;
          default:
            return text.includes(query);
        }
      }),
    );
  }

  private listItems(list: IntPickListList): T[] {
    return list === 'source' ? this.source() : this.target();
  }

  private listModel(list: IntPickListList) {
    return list === 'source' ? this.source : this.target;
  }
}
