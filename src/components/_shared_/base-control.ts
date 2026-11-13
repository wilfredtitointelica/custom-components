import {
  DestroyRef,
  Directive,
  DoCheck,
  Injector,
  Provider,
  Type,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, ValueChangeEvent } from '@angular/forms';
import { IntSize } from './types';

/** Registers a component as its own ControlValueAccessor. */
export function provideValueAccessor(type: () => Type<unknown>): Provider {
  return { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(type), multi: true };
}

/**
 * Tracks the NgControl bound to the same element and exposes `invalid` as a signal
 * (invalid && (touched || dirty)). Call `check()` from `ngDoCheck`: it binds lazily because
 * FormControlName only exposes `control` after its own ngOnChanges.
 * Must be created in an injection context.
 */
export class IntControlStatus {
  readonly invalid = signal(false);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private bound = false;

  /**
   * @param onValue called on every control value change. Lets several accessors bound to the same
   * FormControl (radio groups, checkbox groups) stay in sync — Angular only calls `writeValue` on
   * the accessor that did not originate the change.
   */
  constructor(private readonly onValue?: (value: unknown) => void) {}

  check(): void {
    if (this.bound) return;
    const control = this.injector.get(NgControl, null, { self: true, optional: true })?.control;
    if (!control) return;
    this.bound = true;
    const sync = () => this.invalid.set(control.invalid && (control.touched || control.dirty));
    control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof ValueChangeEvent) this.onValue?.(event.value);
      sync();
    });
    sync();
  }
}

/**
 * Base class for every form control of the library (InputNumber, Select, Listbox, DatePicker...).
 * - Bridges Angular Forms (ngModel / reactive forms) to signals.
 * - Merges the `disabled` input with the forms API disabled state.
 * - Invalid state = explicit `invalid` input OR bound NgControl invalid && (touched || dirty),
 *   same behaviour as PrimeNG v20.
 */
@Directive()
export abstract class IntBaseControl<T> implements ControlValueAccessor, DoCheck {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly size = input<IntSize | undefined>(undefined);
  readonly fluid = input(false, { transform: booleanAttribute });

  /** Current model value. Subclasses read it in templates and write it through `updateValue`. */
  protected readonly modelValue = signal<T | null>(null);

  private readonly formDisabled = signal(false);
  private readonly status = new IntControlStatus((value) => this.modelValue.set((value ?? null) as T | null));

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly isInvalid = computed(() => this.invalid() || this.status.invalid());

  private onModelChange: (value: T | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  writeValue(value: T | null): void {
    this.modelValue.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  ngDoCheck(): void {
    this.status.check();
  }

  /** Sets the value and notifies Angular Forms. */
  protected updateValue(value: T | null): void {
    this.modelValue.set(value);
    this.onModelChange(value);
  }

  protected markAsTouched(): void {
    this.onModelTouched();
  }
}
