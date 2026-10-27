/** A field accessor: a property path ('address.city') or a function. */
export type IntFieldAccessor<T = any> = string | ((item: T) => unknown);

/** Reads `field` from `data`. Supports dot paths and functions, like PrimeNG's ObjectUtils.resolveFieldData. */
export function resolveFieldData(data: unknown, field?: IntFieldAccessor): unknown {
  if (data == null || field == null) return data;
  if (typeof field === 'function') return field(data);
  if (typeof data !== 'object') return undefined;
  if (!field.includes('.')) return (data as Record<string, unknown>)[field];
  return field
    .split('.')
    .reduce<unknown>((acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]), data);
}

/** Structural equality for option values (primitives, dates, plain objects or a `dataKey`). */
export function valueEquals(a: unknown, b: unknown, dataKey?: string): boolean {
  if (dataKey) return resolveFieldData(a, dataKey) === resolveFieldData(b, dataKey);
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return (
      ka.length === kb.length &&
      ka.every((k) => valueEquals((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
    );
  }
  return false;
}

/**
 * Shared option semantics for Listbox, Select and future MultiSelect/AutoComplete:
 * when no optionLabel/optionValue is given, primitives are used as-is.
 */
export interface IntOptionConfig {
  optionLabel?: IntFieldAccessor;
  optionValue?: IntFieldAccessor;
  optionDisabled?: IntFieldAccessor;
}

export function getOptionLabel(option: unknown, config: IntOptionConfig): string {
  const label = config.optionLabel ? resolveFieldData(option, config.optionLabel) : option;
  return label == null ? '' : String(label);
}

export function getOptionValue(option: unknown, config: IntOptionConfig): unknown {
  return config.optionValue ? resolveFieldData(option, config.optionValue) : option;
}

export function isOptionDisabled(option: unknown, config: IntOptionConfig): boolean {
  return config.optionDisabled ? !!resolveFieldData(option, config.optionDisabled) : false;
}

const normalize = (s: string, locale?: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase(locale);

/** Case and accent-insensitive "contains" filter on the option label. */
export function filterOptions<T>(
  options: readonly T[],
  term: string,
  config: IntOptionConfig,
  locale?: string,
): T[] {
  const needle = normalize(term.trim(), locale);
  if (!needle) return [...options];
  return options.filter((o) => normalize(getOptionLabel(o, config), locale).includes(needle));
}
