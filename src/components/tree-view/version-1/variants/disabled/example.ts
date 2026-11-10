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

/** Events and its children cannot be selected. */
function disable(nodes: IntTreeNode[]): IntTreeNode[] {
  const events = nodes.find(node => node.key === 'events');
  if (events) {
    events.expanded = true;
    [events, ...(events.children ?? [])].forEach(node => (node.selectable = false));
  }
  return nodes;
}

@Component({
  selector: 'tree-view-disabled-example',
  templateUrl: './example.html',
  imports: [IntTreeView],
})
export class TreeViewDisabledExample {
  readonly nodes = disable(createNodes());
  readonly selected = signal<IntTreeNode | null>(null);
}
