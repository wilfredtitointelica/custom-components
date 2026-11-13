import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "TreeTable": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/treetable.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 */
export default {
  id: 'treetable',
  variants: [
    'basic',
    'dynamic-columns',
    'template',
    'paginator',
    'single-sort',
    'multiple-sort',
    'sort-icon',
    'filter',
    'single-selection',
    'multiple-selection',
    'checkbox-selection',
    'lazy-load',
    'scroll',
    'gridlines',
    'loading',
    'accessibility',
    'sticky-header',
  ],
  compositions: [
    'fee-chart',
    'estructura-base',
    'fila-total',
    'estado-por-nivel',
    'checkbox-con-propagacion',
  ],
  requires: ['paginator', 'checkbox', 'badge'],
  uses: ['button', 'dropdown-select', 'input', 'search', 'tooltip'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
