import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  IntBaseControl,
  IntConfig,
  IntFieldAccessor,
  IntIcon,
  filterOptions,
  getOptionLabel,
  getOptionValue,
  isOptionDisabled,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import { IntInputText } from '../../../input/version-1/base/input-text';

export interface IntListBoxChangeEvent {
  originalEvent: Event;
  value: unknown;
}

export interface IntListBoxItemContext<T = any> {
  $implicit: T;
  index: number;
  selected: boolean;
}

/**
 * <int-list-box> · version 1. Selectable list (single or multiple) with filter and keyboard
 * navigation (WAI-ARIA listbox). API mirrors PrimeNG v20 Listbox (ported from @intelica/ui `int-listbox`).
 * Also the option engine of Dropdown-select: in `embedded` mode keyboard focus stays on the host
 * component, which forwards key events through `handleKeydown`.
 *
 * @example
 * <int-list-box [options]="countries" optionLabel="name" optionValue="code" [(ngModel)]="code" filter />
 * <int-list-box [options]="brands" multiple checkmark [(ngModel)]="selected">
 *   <ng-template #item let-brand>{{ brand.name }}</ng-template>
 * </int-list-box>
 */
@Component({
  selector: 'int-list-box',
  imports: [NgTemplateOutlet, IntIcon, IntInputText],
  providers: [provideValueAccessor(() => IntListBox)],
  templateUrl: './list-box.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-list-box',
    '[class.int-list-box--embedded]': 'embedded()',
    '[class.int-list-box--disabled]': 'isDisabled()',
    '[class.int-list-box--invalid]': 'isInvalid()',
    '[class.int-list-box--fluid]': 'fluid()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntListBox extends IntBaseControl<unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly options = input<readonly any[]>([]);
  readonly optionLabel = input<IntFieldAccessor | undefined>(undefined);
  readonly optionValue = input<IntFieldAccessor | undefined>(undefined);
  readonly optionDisabled = input<IntFieldAccessor | undefined>(undefined);
  /** Property used to compare object values (e.g. `'id'`). */
  readonly dataKey = input<string | undefined>(undefined);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly filter = input(false, { transform: booleanAttribute });
  readonly filterPlaceholder = input<string | undefined>(undefined);
  readonly checkmark = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string | undefined>(undefined);
  readonly emptyFilterMessage = input<string | undefined>(undefined);
  readonly scrollHeight = input('14rem');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /** Template for options; alternative to a projected `<ng-template #item>`. */
  readonly itemTemplate = input<TemplateRef<IntListBoxItemContext> | undefined>(undefined);
  /** @internal Used by Dropdown-select: no border, keyboard handled by the host component. */
  readonly embedded = input(false, { transform: booleanAttribute });

  readonly onChange = output<IntListBoxChangeEvent>();
  readonly onFilter = output<{ originalEvent: Event; filter: string }>();

  protected readonly config = inject(IntConfig);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly projectedItem = contentChild<TemplateRef<IntListBoxItemContext>>('item');

  readonly listId = uniqueId('int-list-box');
  readonly focusedIndex = signal(-1);
  protected readonly filterValue = signal('');
  protected readonly listFocused = signal(false);

  protected readonly resolvedItemTemplate = computed(() => this.itemTemplate() ?? this.projectedItem());
  private readonly optionConfig = computed(() => ({
    optionLabel: this.optionLabel(),
    optionValue: this.optionValue(),
    optionDisabled: this.optionDisabled(),
  }));

  readonly visibleOptions = computed(() =>
    this.filter()
      ? filterOptions(this.options(), this.filterValue(), this.optionConfig(), this.config.locale())
      : [...this.options()],
  );

  readonly activeDescendant = computed(() => {
    const i = this.focusedIndex();
    return i > -1 && i < this.visibleOptions().length ? this.optionId(i) : null;
  });

  protected optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  label(option: unknown): string {
    return getOptionLabel(option, this.optionConfig());
  }

  isDisabledOption(option: unknown): boolean {
    return isOptionDisabled(option, this.optionConfig());
  }

  isSelected(option: unknown): boolean {
    const optionValue = getOptionValue(option, this.optionConfig());
    const value = this.modelValue();
    if (this.multiple()) {
      return Array.isArray(value) && value.some((v) => valueEquals(v, optionValue, this.dataKey()));
    }
    return value != null && valueEquals(value, optionValue, this.dataKey());
  }

  selectOption(event: Event, option: unknown, index: number): void {
    if (this.isDisabled() || this.isDisabledOption(option)) return;
    this.focusedIndex.set(index);
    const optionValue = getOptionValue(option, this.optionConfig());
    let next: unknown;
    if (this.multiple()) {
      const current = Array.isArray(this.modelValue()) ? (this.modelValue() as unknown[]) : [];
      next = this.isSelected(option)
        ? current.filter((v) => !valueEquals(v, optionValue, this.dataKey()))
        : [...current, optionValue];
    } else {
      next = optionValue;
    }
    this.updateValue(next);
    this.onChange.emit({ originalEvent: event, value: next });
  }

  /** Keyboard contract shared with Dropdown-select (WAI-ARIA listbox pattern). */
  handleKeydown(event: KeyboardEvent): void {
    const options = this.visibleOptions();
    switch (event.key) {
      case 'ArrowDown':
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        this.moveFocus(-1);
        break;
      case 'Home':
        if (event.target instanceof HTMLInputElement) return;
        this.focusedIndex.set(this.nextEnabled(-1, 1));
        break;
      case 'End':
        if (event.target instanceof HTMLInputElement) return;
        this.focusedIndex.set(this.nextEnabled(options.length, -1));
        break;
      case 'Enter':
        if (this.focusedIndex() < 0) return;
        this.selectOption(event, options[this.focusedIndex()], this.focusedIndex());
        break;
      case ' ':
        if (event.target instanceof HTMLInputElement || this.focusedIndex() < 0) return;
        this.selectOption(event, options[this.focusedIndex()], this.focusedIndex());
        break;
      default:
        return;
    }
    event.preventDefault();
    this.scrollToFocused();
  }

  /** Focuses the selected option (or the first enabled one) — used when a host opens the list. */
  activateSelected(): void {
    const options = this.visibleOptions();
    const selected = options.findIndex((o) => this.isSelected(o) && !this.isDisabledOption(o));
    this.focusedIndex.set(selected > -1 ? selected : this.nextEnabled(-1, 1));
    this.scrollToFocused();
  }

  focusFilter(): void {
    this.el.nativeElement.querySelector<HTMLInputElement>('.int-list-box__filter input')?.focus();
  }

  /** Embedded (Dropdown-select): keep focus on the host trigger. Note: a handler returning `false` would preventDefault. */
  protected onOptionMousedown(event: MouseEvent): void {
    if (this.embedded()) event.preventDefault();
  }

  protected onFilterInput(event: Event): void {
    const filter = (event.target as HTMLInputElement).value;
    this.filterValue.set(filter);
    this.focusedIndex.set(this.nextEnabled(-1, 1));
    this.onFilter.emit({ originalEvent: event, filter });
  }

  protected onListFocus(): void {
    this.listFocused.set(true);
    if (this.focusedIndex() < 0) this.activateSelected();
  }

  protected onListBlur(): void {
    this.listFocused.set(false);
    this.markAsTouched();
  }

  private moveFocus(direction: 1 | -1): void {
    const next = this.nextEnabled(this.focusedIndex(), direction);
    if (next > -1) this.focusedIndex.set(next);
  }

  private nextEnabled(from: number, direction: 1 | -1): number {
    const options = this.visibleOptions();
    for (let i = from + direction; i >= 0 && i < options.length; i += direction) {
      if (!this.isDisabledOption(options[i])) return i;
    }
    return from >= 0 && from < options.length ? from : -1;
  }

  private scrollToFocused(): void {
    afterNextRender(
      () => {
        const id = this.activeDescendant();
        if (id) this.el.nativeElement.querySelector(`#${id}`)?.scrollIntoView?.({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }
}
