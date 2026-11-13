import { Component, signal } from '@angular/core';

import { IntTreeNode, IntTreeView } from '../../base/tree-view';

function createNodes(): IntTreeNode[] {
  return [
    {
      key: 'documents',
      label: 'Documents',
      expanded: true,
      children: [
        {
          key: 'work',
          label: 'Work',
          children: [
            { key: 'expenses', label: 'Expenses.doc' },
            { key: 'resume', label: 'Resume.doc' },
          ],
        },
        {
          key: 'home',
          label: 'Home',
          children: [{ key: 'invoices', label: 'Invoices.txt' }],
        },
      ],
    },
    {
      key: 'events',
      label: 'Events',
      children: [
        { key: 'meeting', label: 'Meeting' },
        { key: 'product-launch', label: 'Product Launch' },
        { key: 'report-review', label: 'Report Review' },
      ],
    },
    {
      key: 'movies',
      label: 'Movies',
      children: [
        { key: 'al-pacino', label: 'Al Pacino' },
        { key: 'robert-de-niro', label: 'Robert De Niro' },
      ],
    },
  ];
}

@Component({
  selector: 'tree-view-controlled-example',
  templateUrl: './example.html',
  imports: [IntTreeView],
})
export class TreeViewControlledExample {
  readonly nodes = signal(createNodes());
  readonly selected = signal<IntTreeNode | null>(null);

  expandAll(): void {
    this.setExpanded(this.nodes(), true);
  }

  collapseAll(): void {
    this.setExpanded(this.nodes(), false);
  }

  /** Changes expanded on every node and sets a new array, so the tree reads the new state. */
  private setExpanded(nodes: IntTreeNode[], expanded: boolean): void {
    const walk = (list: IntTreeNode[]) => list.forEach(node => {
      node.expanded = expanded;
      if (node.children) walk(node.children);
    });
    walk(nodes);
    this.nodes.set([...nodes]);
  }
}
