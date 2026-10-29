import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { IntSeverity, IntSize } from '../../../_shared_';
import { IntButton, IntButtonIconPos, IntButtonVariant } from './button';

/**
 * <int-button> · version 1. Element form of the button (PrimeNG v20 `p-button`); it renders a native
 * `<button intButton>` inside, so styles, modifiers, loading/disabled and ARIA are the same as
 * `button[intButton]` (PrimeNG `pButton`). Projected content goes inside the native button.
 *
 * Use `button[intButton]` / `a[intButton]` when you need the native element itself (links, form
 * attributes, directives on the button); `<int-button>` for PrimeNG-style markup.
 * Deviation: `badge`, `raised`, `plain` and `buttonProps` are not implemented.
 *
 * @example
 * <int-button label="Save" icon="icon icon-check" (onClick)="save()" />
 * <int-button type="submit" severity="secondary" size="small">Send</int-button>
 */
@Component({
  selector: 'int-button',
  templateUrl: './button-element.html',
  imports: [IntButton],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntButtonElement {
  readonly label = input<string | undefined>(undefined);
  /** CSS class of the icon, e.g. `icon icon-download` (incontrol-icons). */
  readonly icon = input<string | undefined>(undefined);
  readonly iconPos = input<IntButtonIconPos>('left');
  readonly severity = input<IntSeverity>('primary');
  /** `text` with an icon and no label is the bare icon button (Style Guide `.prButton--icon`). */
  readonly variant = input<IntButtonVariant | undefined>(undefined);
  readonly size = input<IntSize | undefined>(undefined);
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Required for icon-only buttons. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** int-* extension: label hidden until hover or keyboard focus (Figma button-help). */
  readonly labelOnHover = input(false, { transform: booleanAttribute });
  /** Native `type` of the inner button. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Extra classes for the inner native button. */
  readonly styleClass = input<string | undefined>(undefined);

  readonly onClick = output<MouseEvent>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();
}
