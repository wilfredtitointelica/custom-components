import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, forwardRef, input, output,
  signal, TemplateRef, viewChild, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// CDK overlay replaces PrimeNG p-overlay: the panel is attached to the body and positioned under the trigger.
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';

import { IntInputText } from '../../../input/version-1/base/input-text';
// tree-view is in-progress only for the checkbox of int-input; composed real by decision of the designer
// (TreeSelect has no meaning without its tree and the tree is her own component).
import {
  IntTreeNode, IntTreeNodeEvent, IntTreeSelection, IntTreeSelectionMode, IntTreeView,
} from '../../../tree-view/version-1/base/tree-view';

let nextId = 0;

/** Panel under the trigger, or above when there is no room (PrimeNG p-overlay flips the same way). */
const PANEL_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * <int-tree-select> · version 1. Replica of PrimeNG v20 p-treeselect without PrimeNG at runtime.
 * TreeSelect is a form component to choose from hierarchical data. Scope: what the knowledge base, the Style Guide and
 * Figma define; display="chip", select all, size, variant, fluid, loading, virtual scroll and metaKeySelection are
 * left out. The panel is always attached to the body (the knowledge base asks appendTo="body").
 */
@Component({
  selector: 'int-tree-select',
  templateUrl: './tree-select.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet, CdkConnectedOverlay, IntTreeView, IntInputText],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntTreeSelect), multi: true }],
  host: {
    '[class]': 'classes()',
    '(click)': 'onTriggerClick()',
    '(window:resize)': 'hide()',
  },
})
export class IntTreeSelect implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /**
   * Id del input interno; lo usa un `<label for>` externo.
   * @defaultValue 'int-tree-select-N' (autogenerado)
   */
  readonly inputId = input<string>(`int-tree-select-${nextId++}`);
  /** Nodos del árbol del panel. */
  readonly options = input<IntTreeNode[]>([]);
  /** Modo de selección: `single`, `multiple` o `checkbox`. */
  readonly selectionMode = input<IntTreeSelectionMode>('single');
  /** Texto del disparador cuando no hay selección. */
  readonly placeholder = input<string>();
  /** Deshabilita el componente: el panel no se abre. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Muestra el estado inválido (borde y placeholder de error). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Muestra una X en el disparador para limpiar la selección. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Muestra un buscador arriba del árbol. */
  readonly filter = input(false, { transform: booleanAttribute });
  /** Placeholder del buscador. */
  readonly filterPlaceholder = input<string>();
  /** Campo del nodo que compara el buscador (por defecto 'label'). */
  readonly filterBy = input('label');
  /** Texto que se muestra cuando no hay nodos. */
  readonly emptyMessage = input('No results found');
  /** Alto máximo del árbol. Por defecto `252px`, 7 filas (Figma 15195:17805); PrimeNG usa `400px`. */
  readonly scrollHeight = input('252px');
  /** En modo `checkbox`, un padre se marca cuando todos sus hijos lo están. */
  readonly propagateSelectionUp = input(true, { transform: booleanAttribute });
  /** En modo checkbox, marcar un padre marca todos sus hijos. */
  readonly propagateSelectionDown = input(true, { transform: booleanAttribute });
  /** Clase extra del panel (la base de conocimientos la usa junto con `appendTo="body"`). */
  readonly panelStyleClass = input<string>();
  /** Índice de tabulación del disparador. */
  readonly tabindex = input(0);
  /** Etiqueta accesible del disparador. */
  readonly ariaLabel = input<string>();
  /** Id del elemento que etiqueta al disparador. */
  readonly ariaLabelledBy = input<string>();
  /**
   * int-* extension: se pasa al árbol; un clic en la fila de un padre lo expande o colapsa en vez de
   * seleccionarlo.
   */
  readonly labelAsToggle = input(false, { transform: booleanAttribute });
  /** int-* extension: se pasa al árbol; los hijos se muestran sin sangría. */
  readonly childrenAligned = input(false, { transform: booleanAttribute });

  /** Se emite al seleccionar un nodo. */
  readonly onNodeSelect = output<IntTreeNodeEvent>();
  /** Se emite al quitar la selección de un nodo. */
  readonly onNodeUnselect = output<IntTreeNodeEvent>();
  /** Se emite al expandir un nodo. */
  readonly onNodeExpand = output<IntTreeNodeEvent>();
  /** Se emite al colapsar un nodo. */
  readonly onNodeCollapse = output<IntTreeNodeEvent>();
  /** Se emite al abrir el panel. */
  readonly onShow = output<void>();
  /** Se emite al cerrar el panel. */
  readonly onHide = output<void>();
  /** Se emite al limpiar la selección con la X. */
  readonly onClear = output<void>();
  /** Se emite al escribir en el buscador, con el texto y los nodos filtrados. */
  readonly onFilter = output<{ filter: string; filteredValue: IntTreeNode[] }>();
  /** Se emite cuando el disparador recibe el foco. */
  readonly onFocus = output<FocusEvent>();
  /** Se emite cuando el disparador pierde el foco. */
  readonly onBlur = output<FocusEvent>();

  /** Template `value`: reemplaza el texto del disparador; recibe `{ $implicit: value, placeholder }`. */
  protected readonly valueTemplate = contentChild<TemplateRef<{ $implicit: IntTreeSelection; placeholder?: string }>>('value');

  protected readonly focusInput = viewChild.required<ElementRef<HTMLInputElement>>('focusInput');
  protected readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly positions = PANEL_POSITIONS;
  protected readonly listId = computed(() => `${this.inputId()}_list`);

  /** Model value: a node or null in single mode, an array of nodes in multiple and checkbox modes. */
  protected readonly value = signal<IntTreeSelection>(null);
  protected readonly overlayVisible = signal(false);
  protected readonly focused = signal(false);
  protected readonly filterValue = signal('');
  /** Width of the trigger, so the panel opens as wide as it (PrimeNG p-overlay min-width). */
  protected readonly triggerWidth = signal(0);
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly selectedNodes = computed(() => {
    const value = this.value();
    return !value ? [] : Array.isArray(value) ? value : [value];
  });
  protected readonly emptyValue = computed(() => this.selectedNodes().length === 0);
  /** Labels joined by comma, as PrimeNG display="comma". */
  protected readonly label = computed(() => this.selectedNodes().map(node => node.label).join(', '));

  /** Lenient filter of PrimeNG: a match keeps its ancestors, which open to show it. */
  protected readonly filteredOptions = computed(() => {
    const query = this.filterValue().trim().toLocaleLowerCase();
    if (!query) return this.options();
    const field = this.filterBy();
    const walk = (nodes: IntTreeNode[]): IntTreeNode[] =>
      nodes.flatMap(node => {
        const text = String((node as Record<string, unknown>)[field] ?? '').toLocaleLowerCase();
        if (text.includes(query)) return [node];
        const children = walk(node.children ?? []);
        return children.length ? [{ ...node, children, expanded: true }] : [];
      });
    return walk(this.options());
  });

  protected readonly classes = computed(() => {
    const classes = ['int-tree-select'];
    if (this.isDisabled()) classes.push('int-tree-select--disabled');
    if (this.invalid()) classes.push('int-tree-select--invalid');
    if (this.focused()) classes.push('int-tree-select--focus');
    if (this.overlayVisible()) classes.push('int-tree-select--open');
    if (!this.emptyValue()) classes.push('int-tree-select--filled');
    return classes.join(' ');
  });

  private onModelChange: (value: IntTreeSelection) => void = () => {};
  private onTouched: () => void = () => {};

  /** The whole trigger is the origin of the panel. */
  constructor(protected readonly host: ElementRef<HTMLElement>) {}

  /** Abre el panel. */
  show(): void {
    if (this.isDisabled() || this.overlayVisible()) return;
    this.triggerWidth.set(this.host.nativeElement.offsetWidth);
    this.overlayVisible.set(true);
    this.onShow.emit();
  }

  /** Cierra el panel y limpia el buscador. */
  hide(): void {
    if (!this.overlayVisible()) return;
    this.overlayVisible.set(false);
    this.filterValue.set('');
    this.onHide.emit();
  }

  protected onTriggerClick(): void {
    if (this.isDisabled()) return;
    if (this.overlayVisible()) this.hide();
    else this.show();
    this.focusInput().nativeElement.focus();
  }

  /** The panel lives in the body: clicks inside it do not count as outside clicks. */
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.hide();
  }

  /** Trigger keys, as PrimeNG onKeyDown: ArrowDown / Enter / Space open and focus the tree, Escape closes. */
  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowDown':
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        this.show();
        setTimeout(() => this.focusFirstInPanel());
        break;
      case 'Escape':
        this.hide();
        break;
      case 'Tab':
        if (this.overlayVisible()) {
          // Tab goes into the panel instead of leaving the component (validated in the taller).
          this.focusFirstInPanel();
        } else {
          return;
        }
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Panel keys: Escape closes; Tab from the last element goes back to the trigger. */
  protected onPanelKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.hide();
      this.focusInput().nativeElement.focus();
      event.preventDefault();
      return;
    }
    if (event.code === 'Tab' && !event.shiftKey) {
      const focusables = this.panelFocusables();
      if (event.target === focusables[focusables.length - 1]) {
        this.hide();
        this.focusInput().nativeElement.focus();
        event.preventDefault();
      }
    }
  }

  private panelFocusables(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    return panel ? Array.from(panel.querySelectorAll<HTMLElement>('input:not([disabled]), [tabindex="0"]')) : [];
  }

  private focusFirstInPanel(): void {
    this.panelFocusables()[0]?.focus();
  }

  protected onInputFocus(event: FocusEvent): void {
    this.focused.set(true);
    this.onFocus.emit(event);
  }

  protected onInputBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.onTouched();
    this.onBlur.emit(event);
  }

  protected onFilterInput(event: Event): void {
    this.filterValue.set((event.target as HTMLInputElement).value);
    this.onFilter.emit({ filter: this.filterValue(), filteredValue: this.filteredOptions() });
  }

  protected onSelectionChange(selection: IntTreeSelection): void {
    this.value.set(selection);
    this.onModelChange(selection);
  }

  /** Same as PrimeNG: single selection closes the panel; multiple and checkbox keep it open. */
  protected onSelect(event: IntTreeNodeEvent): void {
    this.onNodeSelect.emit(event);
    if (this.selectionMode() === 'single') {
      this.hide();
      this.focusInput().nativeElement.focus();
    }
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    const empty = this.selectionMode() === 'single' ? null : [];
    this.value.set(empty);
    this.onModelChange(empty);
    this.onClear.emit();
  }

  /** ControlValueAccessor: escribe el valor del formulario. */
  writeValue(value: IntTreeSelection): void {
    this.value.set(value ?? null);
  }

  /** ControlValueAccessor: registra la función que avisa los cambios al formulario. */
  registerOnChange(fn: (value: IntTreeSelection) => void): void {
    this.onModelChange = fn;
  }

  /** ControlValueAccessor: registra la función que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: deshabilita el componente desde el formulario. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
