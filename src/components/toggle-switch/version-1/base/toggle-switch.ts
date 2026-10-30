import {
  afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, ElementRef, forwardRef,
  input, numberAttribute, output, signal, TemplateRef, viewChild, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** int-* extension: appearance of the switch. */
export type IntToggleSwitchVariant = 'slider';

/** Payload of onChange, same shape as PrimeNG ToggleSwitchChangeEvent. */
export interface IntToggleSwitchChangeEvent {
  originalEvent: Event;
  checked: boolean;
}

/** Context of the #handle template. */
export interface IntToggleSwitchHandleContext {
  checked: boolean;
}

let nextId = 0;

/**
 * <int-toggle-switch> · version 1. Replica of PrimeNG v20 p-toggleswitch without PrimeNG at runtime.
 * ToggleSwitch is used to select a boolean value. The knowledge base slider is the variant="slider" property; the
 * forced checked one is the forcedChecked property (on and locked).
 */
@Component({
  selector: 'int-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IntToggleSwitch), multi: true }],
  // Same root as PrimeNG: p-toggleswitch puts its root classes and the click listener on the host element.
  // Angular keeps the classes the consumer writes (e.g. int-toggle-switch--slider) next to these.
  host: { '[class]': 'classes()', '(click)': 'onHostClick($event)' },
})
export class IntToggleSwitch implements ControlValueAccessor {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  readonly tabindex = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** Identifier of the input element; an external <label for> uses it. */
  readonly inputId = input<string>(`int-toggle-switch-${nextId++}`);
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Value written to the model when the switch is on. */
  readonly trueValue = input<unknown>(true);
  /** Value written to the model when the switch is off. */
  readonly falseValue = input<unknown>(false);
  readonly ariaLabel = input<string>();
  /** Declared by PrimeNG without styles of its own; kept so p- → int- migrations compile. */
  readonly size = input<'small' | 'large'>();
  readonly ariaLabelledBy = input<string>();
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: appearance. 'slider' is the knowledge base toggle-small (linear track); with PrimeNG it was
   * the .prToggleswitch--slider class, here it is a property as in the variant input of other PrimeNG components.
   */
  readonly variant = input<IntToggleSwitchVariant>();
  /**
   * int-* extension: shown on and locked (knowledge base .prToggleswitch--forcedChecked). Visual only: it never
   * writes to the form model.
   */
  readonly forcedChecked = input(false, { transform: booleanAttribute });

  readonly onChange = output<IntToggleSwitchChangeEvent>();

  protected readonly handleTemplate = contentChild<TemplateRef<IntToggleSwitchHandleContext>>('handle');
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  /** Model value, written by the form (writeValue) or by a click. */
  private readonly modelValue = signal<unknown>(undefined);
  /** Disabled state set by the form (setDisabledState), combined with the disabled input. */
  private readonly formDisabled = signal(false);

  readonly checked = computed(() => this.forcedChecked() || this.modelValue() === this.trueValue());
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled() || this.forcedChecked());

  protected readonly classes = computed(() => {
    const classes = ['int-toggle-switch'];
    if (this.variant() === 'slider') classes.push('int-toggle-switch--slider');
    if (this.checked()) classes.push('int-toggle-switch--checked');
    if (this.isDisabled()) classes.push('int-toggle-switch--disabled');
    if (this.invalid()) classes.push('int-toggle-switch--invalid');
    if (this.forcedChecked()) classes.push('int-toggle-switch--forced-checked');
    return classes.join(' ');
  });

  private onModelChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Same as PrimeNG pAutoFocus: focus once the input is in the DOM.
    afterNextRender(() => {
      if (this.autofocus()) this.inputRef().nativeElement.focus();
    });
  }

  /** Same as PrimeNG onClick: toggles, notifies the form, emits onChange and keeps the focus on the input. */
  protected onHostClick(event: Event): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    const value = this.checked() ? this.falseValue() : this.trueValue();
    this.modelValue.set(value);
    this.onModelChange(value);
    this.onChange.emit({ originalEvent: event, checked: this.checked() });
    this.inputRef().nativeElement.focus();
  }

  writeValue(value: unknown): void {
    this.modelValue.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
