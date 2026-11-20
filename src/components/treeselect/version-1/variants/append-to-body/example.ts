import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntTreeNode } from '../../../../treeview/version-1/base/treeview';
import { IntTreeselect } from '../../base/treeselect';

function createNodes(): IntTreeNode[] {
  return [
    {
      key: 'documents',
      label: 'Documents',
      children: [
        { key: 'work', label: 'Work' },
        { key: 'home', label: 'Home' },
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
  selector: 'treeselect-append-to-body-example',
  templateUrl: './example.html',
  imports: [IntTreeselect, FormsModule],
})
export class TreeselectAppendToBodyExample {
  readonly nodes = createNodes();
  selectedClipped: IntTreeNode | null = null;
  selected: IntTreeNode | null = null;
}
