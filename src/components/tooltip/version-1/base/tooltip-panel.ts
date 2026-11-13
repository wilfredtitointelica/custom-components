import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type IntTooltipContent = string | TemplateRef<unknown> | null | undefined;

/**
 * <int-tooltip>: the floating bubble rendered in the CDK overlay (BEM block `int-tooltip`).
 * Internal — use the `intTooltip` directive (base/tooltip.ts).
 */
@Component({
  selector: 'int-tooltip',
  imports: [NgTemplateOutlet],
  templateUrl: './tooltip.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-tooltip',
    role: 'tooltip',
    '[id]': 'id()',
    '[class]': 'styleClass() ?? ""',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTooltipPanel {
  readonly id = input.required<string>();
  readonly content = input<IntTooltipContent>(null);
  readonly styleClass = input<string | undefined>(undefined);
  protected readonly template = computed(() => {
    const c = this.content();
    return c instanceof TemplateRef ? c : null;
  });
}
