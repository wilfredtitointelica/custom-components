import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, forwardRef, inject, input,
  model, OnInit, output, signal, TemplateRef, ViewEncapsulation,
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

/**
 * <int-tree-view> · version 1. Replica of PrimeNG v20 p-tree without PrimeNG at runtime.
 * Tree is used to display hierarchical data. Scope: what the knowledge base, the Style Guide and Figma define; filter
 * (TreeSelect only), context menu, drag and drop, lazy loading, virtual scroll and metaKeySelection are left out.
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

  readonly value = input<IntTreeNode[]>([]);
  /** Default 'single' as validated for the project (PrimeNG has none: read only). */
  readonly selectionMode = input<IntTreeSelectionMode>('single');
  readonly selection = model<IntTreeSelection>();
  readonly propagateSelectionUp = input(true, { transform: booleanAttribute });
  readonly propagateSelectionDown = input(true, { transform: booleanAttribute });
  readonly emptyMessage = input('No results found');
  readonly ariaLabel = input<string>();
  readonly ariaLabelledBy = input<string>();
  /** int-* extension: a click on a parent row expands or collapses it (Style Guide --labelAsToggle). No checkbox mode. */
  readonly labelAsToggle = input(false, { transform: booleanAttribute });
  /** int-* extension: children without indentation (Style Guide --childrenAligned). */
  readonly childrenAligned = input(false, { transform: booleanAttribute });

  readonly onNodeSelect = output<IntTreeNodeEvent>();
  readonly onNodeUnselect = output<IntTreeNodeEvent>();
  readonly onNodeExpand = output<IntTreeNodeEvent>();
  readonly onNodeCollapse = output<IntTreeNodeEvent>();

  /** #node template, context { $implicit: node }. */
  readonly nodeTemplate = contentChild<TemplateRef<{ $implicit: IntTreeNode }>>('node');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Bumped when a node is expanded or its partial state changes: nodes keep PrimeNG's mutable flags. */
  readonly revision = signal(0);

  protected readonly classes = computed(() => {
    const classes = ['int-tree-view'];
    if (this.selectionMode()) classes.push('int-tree-view--selectable');
    if (this.labelAsToggle() && this.selectionMode() !== 'checkbox') classes.push('int-tree-view--label-as-toggle');
    if (this.childrenAligned()) classes.push('int-tree-view--children-aligned');
    return classes.join(' ');
  });

  isCheckboxMode(): boolean {
    return this.selectionMode() === 'checkbox';
  }

  isLeaf(node: IntTreeNode): boolean {
    return node.leaf === false ? false : !(node.children && node.children.length);
  }

  /** Same as PrimeNG findIndexInSelection: by key, or by reference. */
  findIndexInSelection(node: IntTreeNode): number {
    const selection = this.selection();
    if (!this.selectionMode() || !selection) return -1;
    const same = (other: IntTreeNode) => (other.key && other.key === node.key) || other === node;
    if (this.selectionMode() === 'single') return same(selection as IntTreeNode) ? 0 : -1;
    return (selection as IntTreeNode[]).findIndex(same);
  }

  isSelected(node: IntTreeNode): boolean {
    return this.findIndexInSelection(node) > -1;
  }

  toggle(event: Event, node: IntTreeNode): void {
    node.expanded = !node.expanded;
    this.revision.update(value => value + 1);
    (node.expanded ? this.onNodeExpand : this.onNodeCollapse).emit({ originalEvent: event, node });
  }

  /** Same as PrimeNG onNodeClick without metaKeySelection: a click on a selected node unselects it. */
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

  /** Visible rows in screen order, for the keyboard (roving tabindex as PrimeNG). */
  private visibleNodes(): IntTreeNode[] {
    const rows: IntTreeNode[] = [];
    const walk = (nodes: IntTreeNode[]) => nodes.forEach(node => {
      rows.push(node);
      if (node.expanded && node.children) walk(node.children);
    });
    walk(this.value());
    return rows;
  }

  /** Arrow keys move the focus between the visible rows, as PrimeNG onArrowUp / onArrowDown. */
  focusSibling(node: IntTreeNode, step: 1 | -1): void {
    const rows = this.visibleNodes();
    const next = rows[rows.indexOf(node) + step];
    if (next) this.focusNode(next);
  }

  focusNode(node: IntTreeNode): void {
    const rows = this.visibleNodes();
    const items = this.host.nativeElement.querySelectorAll<HTMLElement>('.int-tree-view__node');
    items.forEach(item => item.setAttribute('tabindex', '-1'));
    const item = items[rows.indexOf(node)];
    item?.setAttribute('tabindex', '0');
    item?.focus();
  }

  /** The tab stop: the first selected row, or the first row (PrimeNG setAllNodesTabIndexes). */
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
