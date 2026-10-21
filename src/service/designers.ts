/**
 * Designers of the team, as written in `static readonly designer = '<name>';` of each base class.
 * Shared by the progress page (Reference → Status) and the documentation page of each component.
 */

/** Label of a version whose base has no `designer` yet. */
export const UNASSIGNED_DESIGNER = 'Sin asignar';

/** Color of each designer (bullets, avatar rings), to tell them apart at a glance. */
const DESIGNER_COLORS: Readonly<Record<string, string>> = {
  'Christian Abanto': '#ffd800', // cadmium yellow
  'Yony León': '#2f7ae5', // blue
  'Gabriela Javier': '#e5559a', // pink: contrasts with the yellow and the blue
};
/** Designers added later (not in the map) take these, by name; unassigned is grey. */
const FALLBACK_COLORS = ['#18a999', '#8b4fd8', '#e5732f', '#5d8a1e'];
const UNASSIGNED_COLOR = '#b9c3d3';

export function designerColor(name: string | undefined): string {
  if (!name || name === UNASSIGNED_DESIGNER) return UNASSIGNED_COLOR;
  const known = DESIGNER_COLORS[name];
  if (known) return known;
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/** "Gabriela Javier" → "GJ"; unassigned → "?". */
export function designerInitials(name: string | undefined): string {
  if (!name || name === UNASSIGNED_DESIGNER) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
