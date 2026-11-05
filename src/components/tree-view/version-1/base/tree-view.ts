import {
  afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, forwardRef,
  inject, input, model, OnInit, output, signal, TemplateRef, viewChild, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Node of the tree, same shape as PrimeNG TreeNode (the fields int-tree-view uses). */
export interface IntTreeNode<T = unknown> {
  label?: string;
  key?: string;
  data?: T;
  icon?: string;
  children?: IntTreeNode<T>[];
  expanded?: boolean;
  /** false: the node cannot be selected (disabled row). */
  selectable?: boolean;
  leaf?: boolean;
  /** Set by the tree in checkbox mode when only some children are selected. */
  partialSelected?: boolean;
  /** Set by the tree: parent node. */
  parent?: IntTreeNode<T>;
}

export type IntTreeSelectionMode = 'single' | 'multiple' | 'checkbox';
export type IntTreeSelection = IntTreeNode | IntTreeNode[] | null | undefined;

/** Payload of onNodeSelect, onNodeUnselect, onNodeExpand and onNodeCollapse, as PrimeNG. */
export interface IntTreeNodeEvent {
  originalEvent: Event;
  node: IntTreeNode;
}

/** Filter mode, same values as PrimeNG Tree filterMode. */
export type IntTreeFilterMode = 'lenient' | 'strict';

/** Payload of onFilter, same shape as PrimeNG TreeFilterEvent. */
export interface IntTreeFilterEvent {
  filter: string;
  filteredValue: IntTreeNode[] | null;
}

/**
 * <int-tree-view> · version 1. Replica of PrimeNG v20 p-tree without PrimeNG at runtime.
 * Tree is used to display hierarchical data. Scope: what the knowledge base, the Style Guide and Figma define plus the
 * filter of PrimeNG; context menu, drag and drop, lazy loading, virtual scroll and metaKeySelection are left out.
 */
@Component({
  selector: 'int-tree-view',
  templateUrl: './tree-view.html',
  styleUrl: '../styles/_index.scss',
  imports: [forwardRef(() => IntTreeViewNode)],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class IntTreeView {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Nodos del árbol. */
  readonly value = input<IntTreeNode[]>([]);
  /**
   * Modo de selección: `single`, `multiple` o `checkbox`. Por defecto `single`, como se validó para el proyecto
   * (PrimeNG no tiene: solo lectura).
   */
  readonly selectionMode = input<IntTreeSelectionMode>('single');
  /** Nodo o nodos seleccionados (two-way con [(selection)]). */
  readonly selection = model<IntTreeSelection>();
  /** En modo `checkbox`, un padre se marca cuando todos sus hijos lo están. */
  readonly propagateSelectionUp = input(true, { transform: booleanAttribute });
  /** En modo checkbox, marcar un padre marca todos sus hijos. */
  readonly propagateSelectionDown = input(true, { transform: booleanAttribute });
  /** Texto que se muestra cuando no hay nodos. */
  readonly emptyMessage = input('No results found');
  /** Etiqueta accesible del árbol. */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta al árbol. */
  readonly ariaLabelledBy = input<string>();
  /**
   * int-* extension: un clic en la fila de un padre lo expande o colapsa en vez de seleccionarlo
   * (.prTreeselect--labelAsToggle del Style Guide). No aplica con checkbox.
   */
  readonly labelAsToggle = input(false, { transform: booleanAttribute });
  /** int-* extension: los hijos se muestran sin sangría (`.prTreeselect--childrenAligned` del Style Guide). */
  readonly childrenAligned = input(false, { transform: booleanAttribute });
  /** Muestra un buscador arriba del árbol que filtra los nodos. */
  readonly filter = input(false, { transform: booleanAttribute });
  /**
   * Campo o campos del nodo (separados por coma) que compara el buscador.
   * @defaultValue 'label'
   */
  readonly filterBy = input('label');
  /**
   * `lenient`: un padre que coincide muestra todos sus hijos; `strict`: solo se muestran los hijos que coinciden.
   * @defaultValue 'lenient'
   */
  readonly filterMode = input<IntTreeFilterMode>('lenient');
  /** Placeholder del buscador. */
  readonly filterPlaceholder = input<string>();
  /** Idioma con el que se pasa a minúsculas el texto al comparar (por ejemplo `tr`). */
  readonly filterLocale = input<string>();
  /** Si es `true`, el buscador recibe el foco al cargar. */
  readonly filterInputAutoFocus = input(false, { transform: booleanAttribute });

  /** Se emite al seleccionar un nodo. */
  readonly onNodeSelect = output<IntTreeNodeEvent>();
  /** Se emite al quitar la selección de un nodo. */
  readonly onNodeUnselect = output<IntTreeNodeEvent>();
  /** Se emite al expandir un nodo. */
  readonly onNodeExpand = output<IntTreeNodeEvent>();
  /** Se emite al colapsar un nodo. */
  readonly onNodeCollapse = output<IntTreeNodeEvent>();
  /** Se emite al escribir en el buscador, con el texto y los nodos filtrados (`null` si el texto está vacío). */
  readonly onFilter = output<IntTreeFilterEvent>();

  /** Template `node`: contenido de cada nodo; recibe `{ $implicit: node }`. */
  readonly nodeTemplate = contentChild<TemplateRef<{ $implicit: IntTreeNode }>>('node');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly filterInput = viewChild<ElementRef<HTMLInputElement>>('filterInput');
  /** Bumped when a node is expanded or its partial state changes: nodes keep PrimeNG's mutable flags. */
  readonly revision = signal(0);
  /** Text typed in the filter. */
  protected readonly filterValue = signal('');

  /**
   * Same rules as PrimeNG _filter: a match is kept, and a parent with matching descendants is copied with only those
   * children and expanded. In strict mode a matching parent also keeps only its matching children. null = no filter.
   */
  protected readonly filteredNodes = computed<IntTreeNode[] | null>(() => {
    const query = this.normalize(this.filterValue());
    if (!query) return null;
    const fields = this.filterBy().split(',').map(field => field.trim());
    const strict = this.filterMode() === 'strict';
    const matches = (node: IntTreeNode) =>
      fields.some(field => this.normalize(String(this.resolveField(node, field) ?? '')).includes(query));
    const walk = (nodes: IntTreeNode[]): IntTreeNode[] =>
      nodes.flatMap(node => {
        const self = matches(node);
        if (self && (!strict || this.isLeaf(node))) return [node];
        const children = walk(node.children ?? []);
        if (children.length) return [{ ...node, children, expanded: true }];
        return self ? [{ ...node, children: [] }] : [];
      });
    return walk(this.value());
  });

  /** Nodes rendered at the root: the filtered ones while filtering, as PrimeNG getRootNode. */
  readonly rootNodes = computed(() => this.filteredNodes() ?? this.value());

  constructor() {
    afterNextRender(() => {
      if (this.filter() && this.filterInputAutoFocus()) this.filterInput()?.nativeElement.focus();
    });
  }

  protected readonly classes = computed(() => {
    const classes = ['int-tree-view'];
    if (this.selectionMode()) classes.push('int-tree-view--selectable');
    if (this.labelAsToggle() && this.selectionMode() !== 'checkbox') classes.push('int-tree-view--label-as-toggle');
    if (this.childrenAligned()) classes.push('int-tree-view--children-aligned');
    return classes.join(' ');
  });

  /** Indica si el modo de selección es `checkbox`. */
  isCheckboxMode(): boolean {
    return this.selectionMode() === 'checkbox';
  }

  /** Indica si el nodo no tiene hijos. */
  isLeaf(node: IntTreeNode): boolean {
    return node.leaf === false ? false : !(node.children && node.children.length);
  }

  /** Posición del nodo en la selección (por `key` o por referencia); `-1` si no está. */
  findIndexInSelection(node: IntTreeNode): number {
    const selection = this.selection();
    if (!this.selectionMode() || !selection) return -1;
    const same = (other: IntTreeNode) => (other.key && other.key === node.key) || other === node;
    if (this.selectionMode() === 'single') return same(selection as IntTreeNode) ? 0 : -1;
    return (selection as IntTreeNode[]).findIndex(same);
  }

  /** Indica si el nodo está seleccionado. */
  isSelected(node: IntTreeNode): boolean {
    return this.findIndexInSelection(node) > -1;
  }

  /** Expande o colapsa el nodo y emite onNodeExpand u onNodeCollapse. */
  toggle(event: Event, node: IntTreeNode): void {
    node.expanded = !node.expanded;
    this.revision.update(value => value + 1);
    (node.expanded ? this.onNodeExpand : this.onNodeCollapse).emit({ originalEvent: event, node });
  }

  /** Selecciona o quita el nodo según el modo; un clic sobre un nodo seleccionado lo quita. */
  onNodeClick(event: Event, node: IntTreeNode): void {
    if (this.labelAsToggle() && !this.isCheckboxMode() && !this.isLeaf(node)) {
      this.toggle(event, node);
      return;
    }
    if (!this.selectionMode() || node.selectable === false) return;
    const index = this.findIndexInSelection(node);
    const selected = index > -1;
    const current = (this.selection() as IntTreeNode[] | null | undefined) ?? [];

    if (this.isCheckboxMode()) {
      if (this.propagateSelectionDown()) this.propagateDown(node, !selected);
      else this.selection.set(selected ? current.filter((_, i) => i !== index) : [...current, node]);
      if (this.propagateSelectionUp() && node.parent) this.propagateUp(node.parent, !selected);
      this.revision.update(value => value + 1);
    } else if (this.selectionMode() === 'single') {
      this.selection.set(selected ? null : node);
    } else {
      this.selection.set(selected ? current.filter((_, i) => i !== index) : [...current, node]);
    }
    (selected ? this.onNodeUnselect : this.onNodeSelect).emit({ originalEvent: event, node });
  }

  /** Same as PrimeNG propagateDown: the node and all its descendants follow the click. */
  private propagateDown(node: IntTreeNode, select: boolean): void {
    const index = this.findIndexInSelection(node);
    const current = (this.selection() as IntTreeNode[] | null | undefined) ?? [];
    if (select && index === -1) this.selection.set([...current, node]);
    else if (!select && index > -1) this.selection.set(current.filter((_, i) => i !== index));
    node.partialSelected = false;
    node.children?.forEach(child => this.propagateDown(child, select));
  }

  /** Same as PrimeNG propagateUp: a parent is selected when all its children are, partial when some are. */
  private propagateUp(node: IntTreeNode, select: boolean): void {
    const children = node.children ?? [];
    const selectedCount = children.filter(child => this.isSelected(child)).length;
    const childPartial = children.some(child => !this.isSelected(child) && child.partialSelected);
    const current = (this.selection() as IntTreeNode[] | null | undefined) ?? [];
    const index = this.findIndexInSelection(node);

    if (select && selectedCount === children.length) {
      if (index === -1) this.selection.set([...current, node]);
      node.partialSelected = false;
    } else {
      if (!select && index > -1) this.selection.set(current.filter((_, i) => i !== index));
      node.partialSelected = childPartial || (selectedCount > 0 && selectedCount !== children.length);
    }
    if (node.parent) this.propagateUp(node.parent, select);
  }

  /** Limpia el texto del buscador y vuelve a mostrar todos los nodos. */
  resetFilter(): void {
    this.filterValue.set('');
    const input = this.filterInput()?.nativeElement;
    if (input) input.value = '';
  }

  protected onFilterInput(event: Event): void {
    this.filterValue.set((event.target as HTMLInputElement).value);
    this.onFilter.emit({ filter: this.filterValue(), filteredValue: this.filteredNodes() });
  }

  /** Lower case without accents, as PrimeNG removeAccents + toLocaleLowerCase(filterLocale). */
  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase(this.filterLocale());
  }

  /** Field of the node by name or dot path (data.name), as PrimeNG resolveFieldData. */
  private resolveField(node: IntTreeNode, field: string): unknown {
    return field.split('.').reduce<unknown>(
      (value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
      node,
    );
  }

  /** Visible rows in screen order, for the keyboard (roving tabindex as PrimeNG). */
  private visibleNodes(): IntTreeNode[] {
    const rows: IntTreeNode[] = [];
    const walk = (nodes: IntTreeNode[]) => nodes.forEach(node => {
      rows.push(node);
      if (node.expanded && node.children) walk(node.children);
    });
    walk(this.rootNodes());
    return rows;
  }

  /** int-* extension: mueve el foco a la fila visible anterior o siguiente (la usa cada fila con las flechas). */
  focusSibling(node: IntTreeNode, step: 1 | -1): void {
    const rows = this.visibleNodes();
    const next = rows[rows.indexOf(node) + step];
    if (next) this.focusNode(next);
  }

  /** int-* extension: lleva el foco a la fila del nodo. */
  focusNode(node: IntTreeNode): void {
    const rows = this.visibleNodes();
    const items = this.host.nativeElement.querySelectorAll<HTMLElement>('.int-tree-view__node');
    items.forEach(item => item.setAttribute('tabindex', '-1'));
    const item = items[rows.indexOf(node)];
    item?.setAttribute('tabindex', '0');
    item?.focus();
  }

  /** int-* extension: indica si la fila del nodo es la que recibe el Tab (la primera seleccionada, o la primera). */
  isTabStop(node: IntTreeNode): boolean {
    const rows = this.visibleNodes();
    const selected = rows.find(row => this.isSelected(row));
    return (selected ?? rows[0]) === node;
  }
}

/** One row of the tree and its children; internal, rendered recursively by int-tree-view. */
@Component({
  selector: 'int-tree-view-node',
  templateUrl: './tree-view-node.html',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class IntTreeViewNode implements OnInit {
  protected readonly tree = inject(IntTreeView);

  readonly node = input.required<IntTreeNode>();
  readonly parentNode = input<IntTreeNode>();
  readonly level = input(0);
  readonly index = input(0);
  readonly setSize = input(0);

  /** Re-read when the tree changes a flag or the consumer sets a new value (controlled expand / collapse). */
  protected readonly expanded = computed(() => {
    this.tree.revision();
    this.tree.value();
    return !!this.node().expanded;
  });
  protected readonly partial = computed(() => {
    this.tree.revision();
    this.tree.selection();
    return !!this.node().partialSelected;
  });
  protected readonly selected = computed(() => this.tree.isSelected(this.node()));
  protected readonly leaf = computed(() => this.tree.isLeaf(this.node()));
  protected readonly disabled = computed(() => this.node().selectable === false);
  protected readonly tabStop = computed(() => {
    this.tree.revision();
    return this.tree.isTabStop(this.node());
  });

  protected readonly contentClasses = computed(() => {
    const classes = ['int-tree-view__node-content'];
    if (this.tree.selectionMode() && !this.disabled()) classes.push('int-tree-view__node-content--selectable');
    if (this.selected()) classes.push('int-tree-view__node-content--selected');
    if (this.disabled()) classes.push('int-tree-view__node-content--disabled');
    return classes.join(' ');
  });

  /** Same as PrimeNG onInit: the node knows its parent, so a checkbox can propagate the selection up. */
  ngOnInit(): void {
    this.node().parent = this.parentNode();
  }

  protected onToggle(event: Event): void {
    event.stopPropagation();
    this.tree.toggle(event, this.node());
  }

  protected onClick(event: Event): void {
    this.tree.onNodeClick(event, this.node());
  }

  /** Same keys as PrimeNG onKeyDown, on the focused row only. */
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    const node = this.node();
    switch (event.code) {
      case 'ArrowDown':
        this.tree.focusSibling(node, 1);
        break;
      case 'ArrowUp':
        this.tree.focusSibling(node, -1);
        break;
      case 'ArrowRight':
        if (!node.expanded && !this.leaf()) this.tree.toggle(event, node);
        else if (node.expanded) this.tree.focusSibling(node, 1);
        break;
      case 'ArrowLeft':
        if (node.expanded) this.tree.toggle(event, node);
        else if (this.parentNode()) this.tree.focusNode(this.parentNode()!);
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        this.onClick(event);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
