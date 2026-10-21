/** Route of the guide inside /components (pinned under "Reference" in the menu). */
export const GUIDE_PATH = '/components/guide';
export const GUIDE_SEGMENT = 'guide';

/** Sections of the guide: one menu link and one #anchor each, in page order. */
export const GUIDE_SECTIONS = [
  { id: 'guide-how-to-ask', name: 'Cómo pedírselo a la IA' },
  { id: 'guide-component', name: 'Crear un componente' },
  { id: 'guide-variant', name: 'Crear una variante' },
  { id: 'guide-version', name: 'Crear una versión' },
  { id: 'guide-status', name: 'Cambiar el estado' },
  { id: 'guide-cheatsheet', name: 'Resumen rápido' },
] as const;
