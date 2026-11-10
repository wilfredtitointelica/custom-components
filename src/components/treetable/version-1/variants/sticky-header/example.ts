import { Component } from '@angular/core';

import { IntTreeNode, IntTreetableModule } from '../../base/treetable';

interface FileRow {
  name: string;
  size: number;
  type: string;
}

/** Root folders with two files each, built once for the demo. */
function buildFolders(count: number, expanded = false): IntTreeNode<FileRow>[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `${i}`,
    expanded,
    data: { name: `Folder ${i + 1}`, size: 20 + i, type: 'Folder' },
    children: [
      { key: `${i}-0`, data: { name: `report-${i + 1}.pdf`, size: 12, type: 'Document' } },
      { key: `${i}-1`, data: { name: `photo-${i + 1}.png`, size: 8 + i, type: 'Image' } },
    ],
  }));
}

const FOLDERS = buildFolders(15, true);

@Component({
  selector: 'treetable-sticky-header-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableStickyHeaderExample {
  protected readonly files = FOLDERS;
}
