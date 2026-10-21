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
