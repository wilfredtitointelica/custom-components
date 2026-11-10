import { Component } from '@angular/core';

import { IntTreeNode, IntTreetableColumn, IntTreetableModule } from '../../base/treetable';

interface FileRow {
  name: string;
  size: number;
  type: string;
}

const COLUMNS: IntTreetableColumn[] = [
  { field: 'name', header: 'Name' },
  { field: 'size', header: 'Size' },
  { field: 'type', header: 'Type' },
];

const FILES: IntTreeNode<FileRow>[] = [
  {
    key: '0',
    data: { name: 'Applications', size: 100, type: 'Folder' },
    children: [
      { key: '0-0', data: { name: 'angular.app', size: 25, type: 'Application' } },
      { key: '0-1', data: { name: 'editor.app', size: 75, type: 'Application' } },
    ],
  },
  {
    key: '1',
    data: { name: 'Documents', size: 75, type: 'Folder' },
    children: [
      { key: '1-0', data: { name: 'Invoices.txt', size: 25, type: 'Text' } },
      { key: '1-1', data: { name: 'Resume.doc', size: 50, type: 'Document' } },
    ],
  },
];

@Component({
  selector: 'treetable-dynamic-columns-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableDynamicColumnsExample {
  protected readonly files = FILES;
  protected readonly columns = COLUMNS;
}
