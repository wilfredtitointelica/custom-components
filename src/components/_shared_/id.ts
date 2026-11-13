let nextId = 0;

/** Generates a document-unique id used to wire ARIA relationships (labelledby, controls, ...). */
export function uniqueId(prefix = 'int'): string {
  return `${prefix}-${++nextId}`;
}
