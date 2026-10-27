/** Pure date helpers for DatePicker. Dates are handled at day precision in local time. */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Adds months, clamping the day (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function sameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function compareDay(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

export function monthNames(locale: string, style: 'long' | 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: style });
  return Array.from({ length: 12 }, (_, m) => capitalize(fmt.format(new Date(2024, m, 1)).replace('.', '')));
}

/** Two-letter weekday names starting at `firstDayOfWeek` (0 = Sunday). */
export function weekdayNames(locale: string, firstDayOfWeek: number): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 2024-01-07 is a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    capitalize(fmt.format(new Date(2024, 0, 7 + ((firstDayOfWeek + i) % 7))).replace('.', '').slice(0, 2)),
  );
}

/**
 * Formats with PrimeNG tokens: d, dd, m, mm, M (short month), MM (long month), y (2 digits), yy (4 digits).
 * Example: 'dd/mm/yy' → 21/10/2026, 'MM yy' → October 2026.
 */
export function formatDate(date: Date, format: string, locale: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return format.replace(/dd|d|mm|m|MM|M|yy|y/g, (token) => {
    switch (token) {
      case 'dd': return pad(date.getDate());
      case 'd': return String(date.getDate());
      case 'mm': return pad(date.getMonth() + 1);
      case 'm': return String(date.getMonth() + 1);
      case 'MM': return monthNames(locale, 'long')[date.getMonth()];
      case 'M': return monthNames(locale, 'short')[date.getMonth()];
      case 'yy': return String(date.getFullYear());
      default: return pad(date.getFullYear() % 100);
    }
  });
}
