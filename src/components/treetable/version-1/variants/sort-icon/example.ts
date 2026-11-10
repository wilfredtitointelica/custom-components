import { Component } from '@angular/core';

import { IntTreeNode, IntTreetableModule, IntTreetableSortIcons } from '../../base/treetable';

interface FileRow {
  name: string;
  size: number;
}

/** Each table gets its own copy: sorting reorders the nodes in place. */
function buildFiles(): IntTreeNode<FileRow>[] {
  return [
    {
      key: '0',
      data: { name: 'Applications', size: 100 },
      children: [
        { key: '0-0', data: { name: 'angular.app', size: 25 } },
        { key: '0-1', data: { name: 'editor.app', size: 75 } },
      ],
    },
    { key: '1', data: { name: 'Cloud', size: 20 } },
    { key: '2', data: { name: 'Documents', size: 75 } },
  ];
}

const SORT_ICONS: IntTreetableSortIcons = {
  unsorted: 'icon icon-sort-table',
  ascending: 'icon icon-arrow-up',
  descending: 'icon icon-arrow-down',
};

@Component({
  selector: 'treetable-sort-icon-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableSortIconExample {
  protected readonly byAttribute = buildFiles();
  protected readonly byTemplate = buildFiles();
  protected readonly sortIcons = SORT_ICONS;
}
