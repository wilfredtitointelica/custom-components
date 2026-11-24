import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "Select": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/select.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 */
export default {
  id: 'select',
  variants: [
    'basic',
    'filter-clear-checkmark',
    'clear-icon',
    'templates',
    'reactive-forms-validation',
    'sizes-fluid',
    'placement',
    'text',
    'append-to-body',
  ],
  requires: ['listbox'],
  uses: ['button', 'skeleton'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
