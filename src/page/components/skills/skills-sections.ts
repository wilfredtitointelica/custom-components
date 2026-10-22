/** Route of the Skills page inside /components (pinned under "Reference" in the menu). */
export const SKILLS_PATH = '/components/skills';
export const SKILLS_SEGMENT = 'skills';

/** Sections of the Skills page: one menu link and one #anchor each, in page order. */
export const SKILLS_SECTIONS = [
  { id: 'skill-how-to-ask', name: 'Cómo pedírselo a la IA' },
  { id: 'skill-component', name: 'Crear un componente' },
  { id: 'skill-variant', name: 'Crear una variante' },
  { id: 'skill-version', name: 'Crear una versión' },
  { id: 'skill-visibility', name: 'Ocultar y reactivar' },
  { id: 'skill-order', name: 'Ordenar variantes' },
  { id: 'skill-rename', name: 'Renombrar' },
  { id: 'skill-remove', name: 'Eliminar' },
  { id: 'skill-status', name: 'Cambiar el estado' },
  { id: 'skill-cheatsheet', name: 'Resumen rápido' },
] as const;
