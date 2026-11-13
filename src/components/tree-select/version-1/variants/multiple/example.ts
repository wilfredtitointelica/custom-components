import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntTreeNode } from '../../../../tree-view/version-1/base/tree-view';
import { IntTreeSelect } from '../../base/tree-select';

function createNodes(): IntTreeNode[] {
  return [
    {
      key: 'documents',
      label: 'Documents',
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
  selector: 'tree-select-multiple-example',
  templateUrl: './example.html',
  imports: [IntTreeSelect, FormsModule],
})
export class TreeSelectMultipleExample {
  readonly nodes = createNodes();
  selected: IntTreeNode[] = [];
}
