import { Component, signal } from '@angular/core';

import { IntDragAndDrop, IntDraggable } from '../../base/drag-and-drop';

interface Product {
  id: string;
  name: string;
}

const PRODUCTS: readonly Product[] = [
  { id: '1', name: 'Fee Library' },
  { id: '2', name: 'Original Invoice' },
  { id: '3', name: 'Penalty Summary' },
];

@Component({
  selector: 'drag-and-drop-disabled-example',
  templateUrl: './example.html',
  imports: [IntDragAndDrop, IntDraggable],
})
export class DragAndDropDisabledExample {
  readonly availableProducts = signal<Product[]>([...PRODUCTS]);
  readonly selectedProducts = signal<Product[]>([]);
  private draggedProduct: Product | null = null;

  dragStart(product: Product): void {
    this.draggedProduct = product;
  }

  dragEnd(): void {
    this.draggedProduct = null;
  }

  /** Moves the dragged product from the list to the drop zone. */
  drop(): void {
    const product = this.draggedProduct;
    if (product) {
      this.selectedProducts.update((products) => [...products, product]);
      this.availableProducts.update((products) => products.filter((item) => item.id !== product.id));
      this.draggedProduct = null;
    }
  }
}
