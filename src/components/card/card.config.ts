import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "Card": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/card.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - Compositions are the version-N/compositions/<slug>/ folders (Compositions tab); compositions
 *   (optional) orders or hides them the same way.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 */
export default {
  id: 'card',
  uses: ['button', 'badge', 'tooltip'],
  variants: [
    'basic',
    'template',
    'compact',
    'outlined',
    'flat',
    'selectable',
    'content-gap',
    'stretch-content',
  ],
  compositions: ['kpi', 'metric-group', 'multi-select', 'option-picker', 'version-picker'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
