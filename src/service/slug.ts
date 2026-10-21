const stripDiacritics = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** "Icons + Border" → "icons-border", "RadioButton" → "radio-button". */
export function toSlug(value: string): string {
  return stripDiacritics(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes text for name search: case, accents, spaces and punctuation are ignored,
 * so "file upload" matches "FileUpload" and "dialogo" matches "Diálogo".
 */
export function toSearchKey(value: string): string {
  return stripDiacritics(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Range [start, end) of `text` matched by `term` under toSearchKey rules, or null. */
export function findMatchRange(text: string, term: string): readonly [number, number] | null {
  const key = toSearchKey(term);
  if (!key) return null;
  let normalized = '';
  const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (const char of toSearchKey(text[i])) {
      normalized += char;
      sourceIndex.push(i);
    }
  }
  const at = normalized.indexOf(key);
  return at < 0 ? null : [sourceIndex[at], sourceIndex[at + key.length - 1] + 1];
}
