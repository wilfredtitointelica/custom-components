import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, contentChildren, forwardRef, inject,
  input, model, TemplateRef, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** int-* extension: appearance of the whole stepper. */
export type IntStepperVariant = 'progressive' | 'descriptive';

/** Context of the #content template of int-step and int-step-panel, same as PrimeNG. */
export interface IntStepContentContext {
  activateCallback: (value?: unknown) => void;
  value: unknown;
  active: boolean;
}

let nextId = 0;

/**
 * <int-stepper> · version 1. Replica of PrimeNG v20 p-stepper without PrimeNG at runtime.
 * The Stepper component displays a wizard-like workflow by guiding users through the multi-step progression.
 * It is composed like PrimeNG: int-step-list > int-step, int-step-panels > int-step-panel, and int-step-item for the
 * vertical layout. linear and transitionOptions are left out: the knowledge base blocks steps with disabled, and the
 * vertical animation uses --i-motion-* tokens.
 */
@Component({
  selector: 'int-stepper',
  templateUrl: './stepper.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()', role: 'tablist', '[attr.id]': 'id' },
})
export class IntStepper {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Gabriela Javier';

  /** Value of the active step. */
  readonly value = model<unknown>();
  /**
   * int-* extension: 'progressive' keeps the previous steps in the active color (knowledge base
   * .prStepper--progressive); 'descriptive' styles the #content of the steps as the Figma stepper descriptive.
   */
  readonly variant = input<IntStepperVariant>();

  readonly id = `int-stepper-${nextId++}`;
  /** Step items present means vertical layout, as in PrimeNG. */
  readonly stepItems = contentChildren(forwardRef(() => IntStepItem));

  protected readonly classes = computed(() => {
    const classes = ['int-stepper'];
    if (this.variant()) classes.push(`int-stepper--${this.variant()}`);
    if (this.stepItems().length) classes.push('int-stepper--vertical');
    return classes.join(' ');
  });

  updateValue(value: unknown): void {
    this.value.set(value);
  }

  isStepActive(value: unknown): boolean {
    return this.value() === value;
  }
}

/** Line between two steps (or beside a vertical panel). */
@Component({
  selector: 'int-stepper-separator',
  templateUrl: './stepper-separator.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-stepper__separator' },
})
export class IntStepperSeparator {}

/** Row of the step headers. */
@Component({
  selector: 'int-step-list',
  templateUrl: './step-list.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-stepper__list' },
})
export class IntStepList {
  readonly steps = contentChildren(forwardRef(() => IntStep));
}

/** Header of one step: number + title, or the #content template. Clicking it activates the step. */
@Component({
  selector: 'int-step',
  imports: [NgTemplateOutlet, IntStepperSeparator],
  templateUrl: './step.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    role: 'presentation',
    '[attr.aria-current]': 'active() ? "step" : null',
  },
})
export class IntStep {
  private readonly stepper = inject(IntStepper);
  private readonly stepList = inject(IntStepList, { optional: true });
  private readonly stepItem = inject(forwardRef(() => IntStepItem), { optional: true });

  readonly value = model<unknown>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly contentTemplate = contentChild<TemplateRef<IntStepContentContext>>('content');

  /** In a step item the step takes the value of its item when it has none of its own (PrimeNG StepItem). */
  protected readonly stepValue = computed(() => this.value() ?? this.stepItem?.value());
  readonly active = computed(() => this.stepper.isStepActive(this.stepValue()));
  /** Same as PrimeNG without linear: only a non-active step can be disabled. */
  readonly isStepDisabled = computed(() => !this.active() && this.disabled());
  protected readonly id = computed(() => `${this.stepper.id}_step_${this.stepValue()}`);
  protected readonly ariaControls = computed(() => `${this.stepper.id}_steppanel_${this.stepValue()}`);
  /** A separator after every step of the list but the last one. */
  protected readonly isSeparatorVisible = computed(() => {
    const steps = this.stepList?.steps() ?? [];
    const index = steps.indexOf(this);
    return index > -1 && index !== steps.length - 1;
  });

  protected readonly classes = computed(() => {
    const classes = ['int-stepper__step'];
    if (this.active()) classes.push('int-stepper__step--active');
    if (this.isStepDisabled()) classes.push('int-stepper__step--disabled');
    return classes.join(' ');
  });

  protected readonly context = computed<IntStepContentContext>(() => ({
    activateCallback: () => this.onStepClick(),
    value: this.stepValue(),
    active: this.active(),
  }));

  protected onStepClick(): void {
    this.stepper.updateValue(this.stepValue());
  }
}

/** Wrapper of the panels in the horizontal layout. */
@Component({
  selector: 'int-step-panels',
  templateUrl: './step-panels.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'int-stepper__panels' },
})
export class IntStepPanels {}

/** Content of one step, rendered only while its step is active. */
@Component({
  selector: 'int-step-panel',
  imports: [NgTemplateOutlet, IntStepperSeparator],
  templateUrl: './step-panel.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    role: 'tabpanel',
    '[attr.id]': 'id()',
    '[attr.aria-controls]': 'ariaControls()',
  },
})
export class IntStepPanel {
  private readonly stepper = inject(IntStepper);
  private readonly stepItem = inject(forwardRef(() => IntStepItem), { optional: true });

  readonly value = model<unknown>();

  protected readonly contentTemplate = contentChild<TemplateRef<IntStepContentContext>>('content');

  /** In a step item the panel takes the value of its item when it has none of its own. */
  private readonly panelValue = computed(() => this.value() ?? this.stepItem?.value());
  readonly active = computed(() => this.stepper.isStepActive(this.panelValue()));
  protected readonly isVertical = computed(() => this.stepper.stepItems().length > 0);
  protected readonly isLast = computed(() => {
    const items = this.stepper.stepItems();
    return !!this.stepItem && items.indexOf(this.stepItem) === items.length - 1;
  });
  protected readonly id = computed(() => `${this.stepper.id}_steppanel_${this.panelValue()}`);
  protected readonly ariaControls = computed(() => `${this.stepper.id}_step_${this.panelValue()}`);

  protected readonly classes = computed(() =>
    this.active() ? 'int-stepper__panel int-stepper__panel--active' : 'int-stepper__panel',
  );

  protected readonly context = computed<IntStepContentContext>(() => ({
    activateCallback: (value?: unknown) => this.stepper.updateValue(value),
    value: this.panelValue(),
    active: this.active(),
  }));
}

/** Vertical layout: groups the int-step and the int-step-panel of one step. */
@Component({
  selector: 'int-step-item',
  templateUrl: './step-item.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()', '[attr.data-p-active]': 'isActive()' },
})
export class IntStepItem {
  private readonly stepper = inject(IntStepper);

  readonly value = model<unknown>();

  readonly isActive = computed(() => this.stepper.isStepActive(this.value()));
  protected readonly classes = computed(() =>
    this.isActive() ? 'int-stepper__item int-stepper__item--active' : 'int-stepper__item',
  );
}

/** All the pieces, as PrimeNG StepperModule: imports: [INT_STEPPER]. */
export const INT_STEPPER = [
  IntStepper, IntStepList, IntStep, IntStepperSeparator, IntStepPanels, IntStepPanel, IntStepItem,
] as const;
