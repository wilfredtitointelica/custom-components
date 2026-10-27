import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import {
  INT_DROPDOWN_POSITIONS,
  IntBaseControl,
  IntConfig,
  IntFieldAccessor,
  IntIcon,
  getOptionLabel,
  getOptionValue,
  provideValueAccessor,
  uniqueId,
  valueEquals,
} from '../../../_shared_';
import {
  IntListBox,
  IntListBoxChangeEvent,
  IntListBoxItemContext,
} from '../../../list-box/version-1/base/list-box';

export interface IntDropdownSelectChangeEvent {
  originalEvent: Event;
  value: unknown;
}

/**
 * <int-dropdown-select> · version 1. Single-value dropdown; API mirrors PrimeNG v20 Select
 * (ported from @intelica/ui `int-select`). The option list is an embedded IntListBox in a CDK
 * overlay, so filtering, templates and keyboard behaviour are shared with List-box.
 *
 * @example
 * <int-dropdown-select [options]="cities" optionLabel="name" optionValue="code" [(ngModel)]="city"
 *                      placeholder="Select a city" filter showClear />
 */
@Component({
  selector: 'int-dropdown-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, NgTemplateOutlet, IntIcon, IntListBox],
  providers: [provideValueAccessor(() => IntDropdownSelect)],
  templateUrl: './dropdown-select.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-dropdown-select',
    '[class.int-dropdown-select--open]': 'open()',
    '[class.int-dropdown-select--disabled]': 'isDisabled()',
    '[class.int-dropdown-select--invalid]': 'isInvalid()',
    '[class.int-dropdown-select--fluid]': 'fluid()',
    '[class.int-dropdown-select--small]': 'size() === "small"',
    '[class.int-dropdown-select--large]': 'size() === "large"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntDropdownSelect extends IntBaseControl<unknown> {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly options = input<readonly any[]>([]);
  readonly optionLabel = input<IntFieldAccessor | undefined>(undefined);
  readonly optionValue = input<IntFieldAccessor | undefined>(undefined);
  readonly optionDisabled = input<IntFieldAccessor | undefined>(undefined);
  readonly dataKey = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly filter = input(false, { transform: booleanAttribute });
  /**
   * Not in PrimeNG: with `filter`, the search input is only shown when there are more options than
   * this number (e.g. `5` → shown from 6 options). Undefined shows it always.
   */
  readonly filterThreshold = input<number | undefined>(undefined);
  readonly filterPlaceholder = input<string | undefined>(undefined);
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly checkmark = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string | undefined>(undefined);
  readonly emptyFilterMessage = input<string | undefined>(undefined);
  readonly scrollHeight = input('14rem');
  readonly panelStyleClass = input<string | undefined>(undefined);
  readonly inputId = input(uniqueId('int-dropdown-select'));
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);

  readonly onChange = output<IntDropdownSelectChangeEvent>();
  readonly onShow = output<void>();
  readonly onHide = output<void>();
  readonly onClear = output<void>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();

  protected readonly config = inject(IntConfig);
  protected readonly positions = INT_DROPDOWN_POSITIONS;
  protected readonly open = signal(false);
  protected readonly triggerWidth = signal(0);
  protected readonly listBox = viewChild(IntListBox);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');

  protected readonly itemTemplate = contentChild<TemplateRef<IntListBoxItemContext>>('item');
  protected readonly selectedItemTemplate = contentChild<TemplateRef<{ $implicit: unknown }>>('selectedItem');

  private readonly optionConfig = computed(() => ({
    optionLabel: this.optionLabel(),
    optionValue: this.optionValue(),
    optionDisabled: this.optionDisabled(),
  }));

  protected readonly selectedOption = computed(() => {
    const value = this.modelValue();
    if (value == null) return undefined;
    return this.options().find((o) =>
      valueEquals(getOptionValue(o, this.optionConfig()), value, this.dataKey()),
    );
  });

  protected readonly showFilter = computed(() => {
    const threshold = this.filterThreshold();
    return this.filter() && (threshold == null || this.options().length > threshold);
  });

  protected readonly hasValue = computed(() => this.selectedOption() !== undefined);
  protected readonly selectedLabel = computed(() => getOptionLabel(this.selectedOption(), this.optionConfig()));

  constructor() {
    super();
    // Keep the embedded list-box in sync and focus the selected option whenever the panel opens.
    effect(() => {
      const listBox = this.listBox();
      if (!listBox) return;
      listBox.writeValue(this.modelValue());
    });
    effect(() => {
      const listBox = this.listBox();
      if (!listBox) return;
      untracked(() => {
        listBox.activateSelected();
        if (this.showFilter()) queueMicrotask(() => listBox.focusFilter());
      });
    });
  }

  show(): void {
    if (this.isDisabled() || this.open()) return;
    this.triggerWidth.set(this.trigger().nativeElement.offsetWidth);
    this.open.set(true);
    this.onShow.emit();
  }

  /** @param focusTrigger return focus to the trigger (default true). */
  close(focusTrigger = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (focusTrigger) this.trigger().nativeElement.focus();
    this.onHide.emit();
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.updateValue(null);
    this.onChange.emit({ originalEvent: event, value: null });
    this.onClear.emit();
  }

  protected onListBoxChange(event: IntListBoxChangeEvent): void {
    this.updateValue(event.value);
    this.onChange.emit(event);
    this.close();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (!this.open()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.show();
      }
      return;
    }
    if (event.key === 'Tab') {
      this.close(false);
      return;
    }
    if (event.key !== 'Escape') this.listBox()?.handleKeydown(event);
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab') {
      this.close();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.trigger().nativeElement.contains(event.target as Node)) this.close(false);
  }

  protected onTriggerBlur(event: FocusEvent): void {
    if (!this.open()) this.markAsTouched();
    this.onBlur.emit(event);
  }
}
