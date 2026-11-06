import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "InputOTP": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/inputotp.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 * - hiddenVersions (optional): version numbers left out of the version picker ([1]); folders stay.
 */
export default {
  id: 'inputotp',
  variants: [
    'basic',
    'mask',
    'integer-only',
    'filled',
    'underlined',
    'sizes',
    'template',
    'separator',
    'separator-template',
    'grouped',
    'accessibility',
    'invalid',
    'disabled',
    'success',
    'loading',
  ],
  requires: ['input'],
  uses: ['button', 'message'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
