import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTreeNode } from '../../../../treeview/version-1/base/treeview';
import { IntTreeselect } from '../../base/treeselect';

function createNodes(): IntTreeNode[] {
  return [
    {
      key: 'documents',
      label: 'Documents',
      children: [
        { key: 'expenses', label: 'Expenses.doc' },
        { key: 'resume', label: 'Resume.doc' },
      ],
    },
    {
      key: 'events',
      label: 'Events',
      children: [
        { key: 'meeting', label: 'Meeting' },
        { key: 'product-launch', label: 'Product Launch' },
      ],
    },
    { key: 'movies', label: 'Movies' },
  ];
}

@Component({
  selector: 'treeselect-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntTreeselect, IntButton, FormsModule],
})
export class TreeselectAvoidElementsExample {
  readonly nodes = createNodes();
  selected: IntTreeNode | null = null;
}
