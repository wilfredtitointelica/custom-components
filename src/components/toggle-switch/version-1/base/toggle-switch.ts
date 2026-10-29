import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, input, output, signal,
  viewChild, ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** int-* extension: appearance of the switch. `slider` is the linear track of Figma "toggle-small". */
export type IntToggleSwitchVariant = 'default' | 'slider';

/** Payload of onChange, same shape as PrimeNG ToggleSwitchChangeEvent. */
export interface IntToggleSwitchChangeEvent {
  originalEvent: Event;
  checked: boolean;
}

let nextId = 0;

/**
 * <int-toggle-switch> · version 1. Replica of PrimeNG v20 p-toggleswitch without PrimeNG at runtime.
 * ToggleSwitch is used to select a boolean value. Scope limited to the knowledge base, Figma and the Style
 * Guide: trueValue/falseValue, readonly, required, name, invalid, size, tabindex, autofocus and the #handle
 * template are left out.
 */
@Component({
  selector: 'int-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntToggleSwitch), multi: true }],
  // Same root as PrimeNG: p-toggleswitch puts its root classes and the click listener on the host element.
  host: { '[class]': 'classes()', '(click)': 'onHostClick($event)' },
})
export class IntToggleSwitch implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Identifier of the input element; an external <label for> uses it. */
  readonly inputId = input<string>(`int-toggle-switch-${nextId++}`);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly ariaLabelledBy = input<string>();
  /** int-* extension: appearance (Style Guide prToggleswitch--slider). */
  readonly variant = input<IntToggleSwitchVariant>('default');
  /**
   * int-* extension: shown on and locked (Style Guide prToggleswitch--forcedChecked). Visual only: it never
   * writes to the form model.
   */
  readonly forcedChecked = input(false, { transform: booleanAttribute });

  readonly onChange = output<IntToggleSwitchChangeEvent>();

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');
  /** Model value, written by the form (writeValue) or by a click. */
  private readonly value = signal(false);
  /** Disabled state set by the form (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  readonly checked = computed(() => this.forcedChecked() || this.value());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled() || this.forcedChecked());

  protected readonly classes = computed(() => {
    const classes = ['int-toggle-switch'];
    if (this.variant() === 'slider') classes.push('int-toggle-switch--slider');
    if (this.checked()) classes.push('int-toggle-switch--checked');
    if (this.isDisabled()) classes.push('int-toggle-switch--disabled');
    if (this.forcedChecked()) classes.push('int-toggle-switch--forced-checked');
    return classes.join(' ');
  });

  private onModelChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  /** Same as PrimeNG onClick: toggles, notifies the form, emits onChange and keeps the focus on the input. */
  protected onHostClick(event: Event): void {
    if (this.isDisabled()) {
      return;
    }
    const checked = !this.value();
    this.value.set(checked);
    this.onModelChange(checked);
    this.onChange.emit({ originalEvent: event, checked });
    this.inputRef().nativeElement.focus();
  }

  writeValue(value: unknown): void {
    this.value.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
