import { Component, DestroyRef, inject, signal } from '@angular/core';

import { IntTreeNode, IntTreetableLazyLoadEvent, IntTreetableModule, IntTreetableNodeEvent } from '../../base/treetable';

interface FileRow {
  name: string;
  size: number;
  type: string;
}

const TOTAL_FOLDERS = 1000;
/** Simulated server delay. */
const DELAY = 600;

@Component({
  selector: 'treetable-lazy-load-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableLazyLoadExample {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly files = signal<IntTreeNode<FileRow>[]>([]);
  protected readonly loading = signal(false);
  protected readonly totalRecords = TOTAL_FOLDERS;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  /** Loads only the requested page of root folders; their children load on expand. */
  protected loadPage(event: IntTreetableLazyLoadEvent): void {
    this.loading.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.files.set(
        Array.from({ length: event.rows }, (_, i) => ({
          key: `${event.first + i}`,
          leaf: false,
          data: { name: `Folder ${event.first + i + 1}`, size: 20, type: 'Folder' },
        })),
      );
      this.loading.set(false);
    }, DELAY);
  }

  protected loadChildren(event: IntTreetableNodeEvent): void {
    const node = event.node as IntTreeNode<FileRow>;
    if (node.children) return;
    this.loading.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      node.children = [
        { key: `${node.key}-0`, data: { name: 'report.pdf', size: 12, type: 'Document' } },
        { key: `${node.key}-1`, data: { name: 'photo.png', size: 8, type: 'Image' } },
      ];
      this.files.update((files) => [...files]);
      this.loading.set(false);
    }, DELAY);
  }
}
