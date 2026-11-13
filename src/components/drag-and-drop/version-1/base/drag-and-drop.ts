import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, DestroyRef, Directive, ElementRef, inject, input,
  output, signal, ViewEncapsulation,
} from '@angular/core';

/** dataTransfer.effectAllowed / dropEffect values accepted by dragEffect and dropEffect. */
export type IntDragAndDropEffect = 'none' | 'copy' | 'move' | 'link' | 'copyMove' | 'copyLink' | 'linkMove' | 'all';

/**
 * <int-drag-and-drop> · version 1. Replica of PrimeNG v20 pDroppable without PrimeNG at runtime: the drop zone.
 * PrimeNG only has directives; this repo needs an <int-*> component, so the drop zone is the component and pDraggable
 * is the [intDraggable] directive below (same file). Native HTML5 drag and drop, as PrimeNG.
 */
@Component({
  selector: 'int-drag-and-drop',
  templateUrl: './drag-and-drop.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same listeners as the PrimeNG Droppable host.
  host: {
    '[class]': 'classes()',
    '(dragenter)': 'dragEnter($event)',
    '(dragleave)': 'dragLeave($event)',
    '(dragover)': 'dragOver($event)',
    '(drop)': 'drop($event)',
  },
})
export class IntDragAndDrop {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Scope que acepta la zona (el valor de `pDroppable`); puede ser un arreglo para aceptar varios. */
  readonly scope = input<string | string[]>();
  /** Cursor del navegador al pasar sobre la zona (`dataTransfer.dropEffect`). */
  readonly dropEffect = input<IntDragAndDropEffect>();
  /** Deshabilita la zona: no acepta items (`pDroppableDisabled` en PrimeNG). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Se emite cuando un item arrastrado entra a la zona. */
  readonly onDragEnter = output<DragEvent>();
  /** Se emite cuando un item arrastrado sale de la zona. */
  readonly onDragLeave = output<DragEvent>();
  /** Se emite al soltar en la zona un item con un `scope` aceptado. */
  readonly onDrop = output<DragEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** A draggable is over the zone (PrimeNG p-draggable-enter). */
  protected readonly entered = signal(false);

  protected readonly classes = computed(() => {
    const classes = ['int-drag-and-drop'];
    if (this.entered()) classes.push('int-drag-and-drop--enter');
    if (this.disabled()) classes.push('int-drag-and-drop--disabled');
    return classes.join(' ');
  });

  /** Without preventDefault the browser does not allow the drop; PrimeNG unbinds it while disabled. */
  protected dragOver(event: DragEvent): void {
    if (!this.disabled()) event.preventDefault();
  }

  protected dragEnter(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    const dropEffect = this.dropEffect();
    if (dropEffect && event.dataTransfer) event.dataTransfer.dropEffect = dropEffect as DataTransfer['dropEffect'];
    this.entered.set(true);
    this.onDragEnter.emit(event);
  }

  /** Ignores the dragleave fired when the pointer moves onto a child of the zone. */
  protected dragLeave(event: DragEvent): void {
    event.preventDefault();
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.entered.set(false);
      this.onDragLeave.emit(event);
    }
  }

  protected drop(event: DragEvent): void {
    if (this.allowDrop(event)) {
      this.entered.set(false);
      event.preventDefault();
      this.onDrop.emit(event);
    }
  }

  /** Same as PrimeNG allowDrop: the scope written by the draggable on dragstart must match. */
  private allowDrop(event: DragEvent): boolean {
    if (this.disabled()) {
      return false;
    }
    const dragScope = event.dataTransfer?.getData('text');
    const scope = this.scope();
    return Array.isArray(scope) ? scope.some((value) => value === dragScope) : typeof scope === 'string' && scope === dragScope;
  }
}

/**
 * [intDraggable] · replica of PrimeNG v20 pDraggable: makes any element draggable towards an <int-drag-and-drop>
 * with the same scope. Inputs: intDraggable (scope), dragEffect, dragHandle (CSS selector), intDraggableDisabled.
 * Outputs: onDragStart, onDrag, onDragEnd (DragEvent).
 */
@Directive({
  selector: '[intDraggable]',
  host: {
    class: 'int-drag-and-drop__draggable',
    '[class.int-drag-and-drop__draggable--handle]': '!!dragHandle()',
    '[attr.draggable]': 'intDraggableDisabled() ? null : true',
    '(dragstart)': 'dragStart($event)',
    '(dragend)': 'dragEnd($event)',
    '(mousedown)': 'handle = $event.target',
    '(mouseup)': 'handle = null',
  },
})
export class IntDraggable {
  /** Scope del item (el valor de `pDraggable`); la zona lo acepta si coincide con su `scope`. */
  readonly intDraggable = input<string>('');
  /** Efecto permitido al arrastrar (`dataTransfer.effectAllowed`). */
  readonly dragEffect = input<IntDragAndDropEffect>();
  /** Selector CSS del asa: el arrastre solo empieza si se presiona sobre ese elemento. */
  readonly dragHandle = input<string>();
  /** Deshabilita el arrastre del elemento. */
  readonly intDraggableDisabled = input(false, { transform: booleanAttribute });

  /** Se emite al empezar a arrastrar. */
  readonly onDragStart = output<DragEvent>();
  /** Se emite continuamente mientras se arrastra. */
  readonly onDrag = output<DragEvent>();
  /** Se emite al terminar de arrastrar, se haya soltado o no en una zona. */
  readonly onDragEnd = output<DragEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Element under the pointer on mousedown, checked against dragHandle on dragstart. */
  protected handle: EventTarget | null = null;
  private removeDragListener: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unbindDragListener());
  }

  protected dragStart(event: DragEvent): void {
    if (this.intDraggableDisabled() || !this.allowDrag()) {
      event.preventDefault();
      return;
    }
    const dragEffect = this.dragEffect();
    if (event.dataTransfer) {
      if (dragEffect) event.dataTransfer.effectAllowed = dragEffect;
      event.dataTransfer.setData('text', this.intDraggable());
    }
    this.onDragStart.emit(event);
    this.bindDragListener();
  }

  protected dragEnd(event: DragEvent): void {
    this.onDragEnd.emit(event);
    this.unbindDragListener();
  }

  private allowDrag(): boolean {
    const dragHandle = this.dragHandle();
    return dragHandle && this.handle instanceof Element ? this.handle.matches(dragHandle) : true;
  }

  // The drag event fires many times per second: listened to only while dragging, as PrimeNG.
  private bindDragListener(): void {
    if (this.removeDragListener) {
      return;
    }
    const element = this.host.nativeElement;
    const onDrag = (event: DragEvent) => this.onDrag.emit(event);
    element.addEventListener('drag', onDrag);
    this.removeDragListener = () => element.removeEventListener('drag', onDrag);
  }

  private unbindDragListener(): void {
    this.removeDragListener?.();
    this.removeDragListener = null;
  }
}
