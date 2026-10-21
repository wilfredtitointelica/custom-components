import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "TreeSelect": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/tree-select.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 */
export default {
  id: 'tree-select',
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
