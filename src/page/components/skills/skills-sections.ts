/** Route of the Skills page inside /components (pinned under "Reference" in the menu). */
export const SKILLS_PATH = '/components/skills';
export const SKILLS_SEGMENT = 'skills';

export interface SkillSection {
  readonly id: string;
  readonly name: string;
  /** Highlight chip next to the menu link (e.g. "New" for a featured skill). */
  readonly badge?: string;
}

/** Sections of the Skills page: one menu link and one #anchor each, in page order. */
export const SKILLS_SECTIONS: readonly SkillSection[] = [
  { id: 'skill-how-to-ask', name: 'Cómo pedírselo a la IA' },
  { id: 'skill-component', name: 'Crear un componente' },
  { id: 'skill-variant', name: 'Crear una variante' },
  { id: 'skill-version', name: 'Crear una versión' },
  { id: 'skill-visibility', name: 'Ocultar y reactivar' },
  { id: 'skill-order', name: 'Ordenar variantes' },
  { id: 'skill-rename', name: 'Renombrar' },
  { id: 'skill-remove', name: 'Eliminar' },
  { id: 'skill-status', name: 'Cambiar el estado' },
  { id: 'skill-replicate', name: 'Replicar de PrimeNG', badge: 'New' },
  { id: 'skill-cheatsheet', name: 'Resumen rápido' },
];
