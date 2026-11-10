import { Component, computed, signal } from '@angular/core';

import { IntTreeNode, IntTreetableModule } from '../../base/treetable';

interface FileRow {
  name: string;
  size: number;
  type: string;
}

const FILES: IntTreeNode<FileRow>[] = [
  {
    key: '0',
    data: { name: 'Applications', size: 100, type: 'Folder' },
    children: [
      {
        key: '0-0',
        data: { name: 'Angular', size: 25, type: 'Folder' },
        children: [
          { key: '0-0-0', data: { name: 'angular.app', size: 10, type: 'Application' } },
          { key: '0-0-1', data: { name: 'cli.app', size: 15, type: 'Application' } },
        ],
      },
      { key: '0-1', data: { name: 'editor.app', size: 75, type: 'Application' } },
    ],
  },
  {
    key: '1',
    data: { name: 'Cloud', size: 20, type: 'Folder' },
    children: [
      { key: '1-0', data: { name: 'backup-1.zip', size: 12, type: 'Zip' } },
      { key: '1-1', data: { name: 'backup-2.zip', size: 8, type: 'Zip' } },
    ],
  },
  {
    key: '2',
    data: { name: 'Documents', size: 75, type: 'Folder' },
    children: [
      { key: '2-0', data: { name: 'Invoices.txt', size: 25, type: 'Text' } },
      {
        key: '2-1',
        data: { name: 'Work', size: 50, type: 'Folder' },
        children: [
          { key: '2-1-0', data: { name: 'Expenses.doc', size: 30, type: 'Document' } },
          { key: '2-1-1', data: { name: 'Resume.doc', size: 20, type: 'Document' } },
        ],
      },
    ],
  },
];

@Component({
  selector: 'treetable-multiple-selection-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableMultipleSelectionExample {
  protected readonly files = FILES;
  protected readonly selected = signal<IntTreeNode | IntTreeNode[] | null>([]);
  protected readonly selectedNames = computed(() => {
    const nodes = this.selected();
    return Array.isArray(nodes) && nodes.length ? nodes.map((node) => (node.data as FileRow).name).join(', ') : 'None';
  });
}
