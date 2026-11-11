import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/** Severities of p-badge; without a value the badge is primary. */
export type IntBadgeSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';

/** Sizes of p-badge; without a value the badge is medium. */
export type IntBadgeSize = 'small' | 'large' | 'xlarge';

/**
 * <int-badge> · version 1. Replica of PrimeNG v20 p-badge without PrimeNG at runtime.
 * A small indicator of a quantity: a number, a short text or, without a value, a dot.
 */
@Component({
  selector: 'int-badge',
  templateUrl: './badge.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-badge puts its root classes on the host and hides it when disabled.
  host: {
    '[class]': 'classes()',
    '[style.display]': 'badgeDisabled() ? "none" : null',
  },
})
export class IntBadge {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Valor que se muestra dentro del badge. Sin valor el badge es un punto. */
  readonly value = input<string | number | null>();
  /** Severidad del badge: `secondary`, `info`, `success`, `warn`, `danger` o `contrast`. Sin valor usa el color primario. */
  readonly severity = input<IntBadgeSeverity | null>();
  /** Tamaño del badge: `small`, `large` o `xlarge`; sin valor es mediano. */
  readonly badgeSize = input<IntBadgeSize | null>();
  /** Tamaño del badge. Obsoleto en PrimeNG: usar `badgeSize`. */
  readonly size = input<IntBadgeSize | null>();
  /** Oculta el badge. */
  readonly badgeDisabled = input(false, { transform: booleanAttribute });

  /** Block plus active modifiers, as PrimeNG's root classes (badgeSize wins over the deprecated size). */
  protected readonly classes = computed(() => {
    const value = this.value();
    const empty = value === undefined || value === null || value === '';
    const severity = this.severity();
    const size = this.badgeSize() ?? this.size();
    return [
      'int-badge',
      !empty && String(value).length === 1 ? 'int-badge--circle' : '',
      empty ? 'int-badge--dot' : '',
      size ? `int-badge--${size}` : '',
      severity ? `int-badge--${severity}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}

/**
 * <int-overlay-badge> · version 1. Replica of PrimeNG v20 p-overlaybadge: projects its content and
 * places an <int-badge> on its top end corner.
 */
@Component({
  selector: 'int-overlay-badge',
  imports: [IntBadge],
  template: `
    <div class="int-overlay-badge">
      <ng-content />
      <int-badge
        [severity]="severity()"
        [badgeSize]="badgeSize()"
        [size]="size()"
        [value]="value()"
        [badgeDisabled]="badgeDisabled()"
      />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The root is the template div, as in PrimeNG; the host does not add a box.
  host: { style: 'display: contents' },
})
export class IntOverlayBadge {
  /** Valor que se muestra dentro del badge. Sin valor el badge es un punto. */
  readonly value = input<string | number | null>();
  /** Severidad del badge: `secondary`, `info`, `success`, `warn`, `danger` o `contrast`. Sin valor usa el color primario. */
  readonly severity = input<IntBadgeSeverity | null>();
  /** Tamaño del badge: `small`, `large` o `xlarge`; sin valor es mediano. */
  readonly badgeSize = input<IntBadgeSize | null>();
  /** Tamaño del badge. Obsoleto en PrimeNG: usar `badgeSize`. */
  readonly size = input<IntBadgeSize | null>();
  /** Oculta el badge; el contenido sigue visible. */
  readonly badgeDisabled = input(false, { transform: booleanAttribute });
}
