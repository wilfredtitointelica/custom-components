import { filterOptions, getOptionLabel, getOptionValue, resolveFieldData, valueEquals } from './options';

describe('core/options', () => {
  it('resolves nested paths and functions', () => {
    const data = { a: { b: { c: 42 } } };
    expect(resolveFieldData(data, 'a.b.c')).toBe(42);
    expect(resolveFieldData(data, (d: typeof data) => d.a.b.c * 2)).toBe(84);
    expect(resolveFieldData(null, 'a')).toBeNull();
  });

  it('compares values structurally or by dataKey', () => {
    expect(valueEquals({ id: 1, n: 'a' }, { id: 1, n: 'a' })).toBeTrue();
    expect(valueEquals({ id: 1, n: 'a' }, { id: 1, n: 'b' })).toBeFalse();
    expect(valueEquals({ id: 1, n: 'a' }, { id: 1, n: 'b' }, 'id')).toBeTrue();
    expect(valueEquals(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBeTrue();
  });

  it('uses primitives as-is when no optionLabel/optionValue is given', () => {
    expect(getOptionLabel('Visa', {})).toBe('Visa');
    expect(getOptionValue({ code: 'PE' }, { optionValue: 'code' })).toBe('PE');
  });

  it('filters ignoring case and accents', () => {
    const options = [{ name: 'Perú' }, { name: 'Panamá' }, { name: 'Chile' }];
    const result = filterOptions(options, 'PERU', { optionLabel: 'name' });
    expect(result.map((o) => o.name)).toEqual(['Perú']);
  });
});
