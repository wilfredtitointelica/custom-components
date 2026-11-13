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
  selector: 'tree-view-children-aligned-example',
  templateUrl: './example.html',
  imports: [IntTreeView],
})
export class TreeViewChildrenAlignedExample {
  readonly nodes = createNodes();
  readonly selected = signal<IntTreeNode | null>(null);
}
