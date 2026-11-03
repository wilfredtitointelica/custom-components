import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "Demo": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/demo.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - Compositions are the version-N/compositions/<slug>/ folders (Compositions tab); compositions
 *   (optional) orders or hides them the same way.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 * Demo is a reference implementation of the whole flow (config → base → variants → compositions); it is
 * not in the Excel. It follows every rule of AGENTS.md: `npm run check:component -- demo` gives 0 errors.
 * Its folder is _demo_ (underscores keep it first on disk; the ID stays "demo") and `reference: true`
 * pins it at the top of the menu, above the component list.
 */
export default {
  id: 'demo',
  reference: true,
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
