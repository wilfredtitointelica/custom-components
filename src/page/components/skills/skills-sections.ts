/** Route of the Skills page inside /components (pinned under "Reference" in the menu). */
export const SKILLS_PATH = '/components/skills';
export const SKILLS_SEGMENT = 'skills';

/** Groups of the Skills menu, in order. A dotted separator (with its label, if any) opens each one. */
export type SkillGroup = 'intro' | 'structure' | 'implementation' | 'maintenance' | 'tracking';

/** Separator label of each group; intro (the first one) never gets a separator. */
export const SKILL_GROUP_LABELS: Readonly<Record<SkillGroup, string>> = {
  intro: '',
  structure: 'Estructura',
  implementation: 'Implementación',
  maintenance: 'Mantenimiento',
  tracking: 'Seguimiento',
};

export interface SkillSection {
  readonly id: string;
  readonly name: string;
  readonly group: SkillGroup;
  /** Highlight chip next to the menu link (e.g. "New" for a featured skill). */
  readonly badge?: string;
}

/** Sections of the Skills page: one menu link and one #anchor each, in page order (groups contiguous). */
export const SKILLS_SECTIONS: readonly SkillSection[] = [
  { id: 'skill-how-to-ask', name: 'Cómo pedírselo a la IA', group: 'intro' },
  { id: 'skill-cheatsheet', name: 'Resumen rápido', group: 'intro' },
  { id: 'skill-component', name: 'Crear un componente', group: 'structure' },
  { id: 'skill-variant', name: 'Crear una variante', group: 'structure' },
  { id: 'skill-version', name: 'Crear una versión', group: 'structure' },
  { id: 'skill-visibility', name: 'Ocultar y reactivar', group: 'structure' },
  { id: 'skill-order', name: 'Ordenar variantes', group: 'structure' },
  { id: 'skill-rename', name: 'Renombrar', group: 'structure' },
  { id: 'skill-remove', name: 'Eliminar', group: 'structure' },
  { id: 'skill-replicate', name: 'Replicar de PrimeNG', group: 'implementation' },
  { id: 'skill-standardize', name: 'Estandarizar un componente', group: 'implementation' },
  { id: 'skill-sync', name: 'Sincronizar un componente', group: 'maintenance' },
  { id: 'skill-dependencies', name: 'Resolver dependencias', group: 'maintenance' },
  { id: 'skill-status', name: 'Cambiar el estado', group: 'tracking' },
];
