import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "MultiSelect": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/multiselect.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 */
export default {
  id: 'multiselect',
  variants: [
    'basic',
    'chips',
    'group',
    'template',
    'filter',
    'loading-state',
    'virtual-scroll',
    'filled',
    'sizes',
    'fluid',
    'clear-icon',
    'invalid',
    'disabled',
    'accessibility',
    'readonly',
    'success',
    'append-to-body',
  ],
  compositions: ['selected-items-label', 'brands'],
  requires: ['chip', 'input', 'tooltip'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
