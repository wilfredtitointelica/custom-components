import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTreeNode } from '../../../../tree-view/version-1/base/tree-view';
import { IntTreeSelect } from '../../base/tree-select';

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
  selector: 'tree-select-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntTreeSelect, IntButton, FormsModule],
})
export class TreeSelectAvoidElementsExample {
  readonly nodes = createNodes();
  selected: IntTreeNode | null = null;
}
