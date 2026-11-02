import { DefaultExport, Routes } from '@angular/router';

import { COMPONENT_INVENTORY } from '../components/inventory';
import {
  CATALOG,
  ComponentCatalog,
  findVariantInComponent,
  findVersion,
  resolveInventory,
} from './component-catalog';

/** Column A of "Listado de componentes a replicar" (rows 2–37), verbatim. */
const EXCEL_NAMES = [
  'Accordion',
  'Button',
  'Dropdown / Select',
  'Input (InputText, Checkbox, RadioButton, Textarea)',
  'FileUpload',
  'DatePicker',
  'ListBox',
  'Dialog / Modal',
  'Tabs (V1 / V2)',
  'Tooltip',
  'Pill',
  'Popover',
  'Alertas',
  'ToggleSwitch',
  'Slider',
  'TreeView',
  'Search',
  'Stepper',
  'TreeSelect',
  'Drag and Drop',
  'Table',
  'FileDrop',
  'Carousel',
  'Message',
  'MultiSelect',
  'Timeline',
  'Toast',
  'TreeTable',
  'Card',
  'Badge',
  'Search Dropdown',
  'Breadcrumb',
  'Paginator',
  'InputOTP',
  'Password',
  'ProgressBar',
];

/** Components added outside the Excel (chip and tag split from Badge; confirm-dialog-modal from Dialog). */
const NON_EXCEL_IDS = ['chip', 'tag', 'confirm-dialog-modal'];

describe('Component catalog', () => {
  const catalog = new ComponentCatalog();

  it('lists exactly the Excel components, in the Excel order', () => {
    const excel = COMPONENT_INVENTORY.filter((c) => !c.reference && !NON_EXCEL_IDS.includes(c.id)); // demo: reference implementation
    expect(excel.map((c) => c.sourceName ?? catalog.find(c.id)!.name)).toEqual(EXCEL_NAMES);
  });

  it('keeps the original Excel name only for simplified titles', () => {
    const renamed = COMPONENT_INVENTORY.filter((c) => c.sourceName).map((c) => catalog.find(c.id)!.name);
    expect(renamed).toEqual(['Input', 'Dialog (Modal)', 'Tabs']);
  });

  it('takes titles and descriptions from the HTML headers, over the config', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [chip] = resolveInventory([{ id: 'chip', loadRoutes }], {
      chip: [
        { number: 1, folder: 'version-1', title: 'Old chip', examples: ['basic'] },
        {
          number: 2,
          folder: 'version-2',
          title: 'Chip',
          description: 'Compact element.',
          examples: ['basic', 'raised'],
          exampleMeta: {
            basic: { title: 'Default' },
            raised: { title: 'Raised', description: 'Shadow to indicate elevation.' },
          },
        },
      ],
    });
    expect([chip.name, chip.description]).toEqual(['Chip', 'Compact element.']);
    expect(chip.variants.map((v) => [v.id, v.name, v.description])).toEqual([
      ['chip-basic', 'Default', undefined],
      ['chip-raised', 'Raised', 'Shadow to indicate elevation.'],
    ]);
  });

  it('builds unique, URL-safe IDs for components and variants', () => {
    const ids = CATALOG.flatMap((c) => [c.id, ...c.variants.map((v) => v.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('every component documents its basic variant first, with an ID derived from the component ID', () => {
    for (const component of CATALOG) {
      expect(component.variants[0]?.id).withContext(component.id).toBe(`${component.id}-basic`);
    }
  });

  it('documents only the variant folders that exist, ignoring config entries without a folder', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [chip] = resolveInventory(
      [{ id: 'chip', variants: ['Disabled', 'Outlined', { name: 'InputText', slug: 'text' }], loadRoutes }],
      { chip: [{ number: 1, folder: 'version-1', examples: ['text', 'basic', 'outlined', 'accent'] }] },
    );
    expect(chip.variants.map((v) => v.id)).toEqual([
      'chip-outlined',
      'chip-text',
      'chip-basic',
      'chip-accent',
    ]);
  });

  it('rejects colliding IDs', () => {
    const loadRoutes = () => Promise.resolve([]);
    expect(() =>
      resolveInventory(
        [
          { id: 'search', name: 'Search', loadRoutes },
          { id: 'search-dropdown', name: 'Search Dropdown', loadRoutes },
        ],
        { search: [{ number: 1, folder: 'version-1', examples: ['dropdown'] }] },
      ),
    ).toThrowError(/Duplicated ID "search-dropdown"/);
  });

  it('keeps the components it requires, even not created yet, and rejects invalid ones', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [multiSelect] = resolveInventory([
      { id: 'multi-select', requires: ['checkbox', 'pill'], loadRoutes },
    ]);
    expect(multiSelect.requires).toEqual(['checkbox', 'pill']);
    expect(resolveInventory([{ id: 'chip', loadRoutes }])[0].requires).toEqual([]);
    expect(() => resolveInventory([{ id: 'chip', requires: ['chip'], loadRoutes }])).toThrowError(
      /requires an invalid ID "chip"/,
    );
    expect(() => resolveInventory([{ id: 'chip', requires: ['Check Box'], loadRoutes }])).toThrowError(
      /requires an invalid ID/,
    );
  });

  it('keeps the components used in its variant templates apart from the required ones', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [card] = resolveInventory([{ id: 'card', uses: ['button', 'badge'], loadRoutes }]);
    expect(card.uses).toEqual(['button', 'badge']);
    expect(card.requires).toEqual([]);
    expect(resolveInventory([{ id: 'chip', loadRoutes }])[0].uses).toEqual([]);
    expect(() => resolveInventory([{ id: 'card', uses: ['card'], loadRoutes }])).toThrowError(
      /uses an invalid ID "card"/,
    );
  });

  it('leaves hidden components and variants out of the catalog, keeping their IDs reserved', () => {
    const loadRoutes = () => Promise.resolve([]);
    const resolved = resolveInventory(
      [
        {
          id: 'chip',
          name: 'Chip',
          variants: [{ name: 'Outlined', hidden: true }],
          loadRoutes,
        },
        { id: 'draft', name: 'Draft', hidden: true, loadRoutes },
      ],
      { chip: [{ number: 1, folder: 'version-1', examples: ['basic', 'outlined'] }] },
    );
    expect(resolved.map((c) => c.id)).toEqual(['chip']);
    expect(resolved[0].variants.map((v) => v.id)).toEqual(['chip-basic']);
    expect(resolved[0].hiddenVariantIds).toEqual(['chip-outlined']);
    expect(() =>
      resolveInventory([
        { id: 'chip', name: 'Chip', variants: [{ name: 'Outlined', hidden: true }], loadRoutes },
        { id: 'chip-outlined', name: 'Chip Outlined', loadRoutes },
      ]),
    ).toThrowError(/Duplicated ID "chip-outlined"/);
  });

  it('attaches the detected version folders, ascending, and defaults to the latest', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [chip] = resolveInventory([{ id: 'chip', name: 'Chip', loadRoutes }], {
      chip: [
        { number: 2, folder: 'version-2', examples: [] },
        { number: 1, folder: 'version-1', examples: [] },
      ],
    });
    expect(chip.versions.map((v) => v.number)).toEqual([1, 2]);
    expect(findVersion(chip, null)?.number).toBe(2);
    expect(findVersion(chip, '1')?.number).toBe(1);
    expect(findVersion(chip, '9')?.number).toBe(2);
  });

  it('leaves hidden versions (and the variants that only live there) out of the catalog', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [chip] = resolveInventory([{ id: 'chip', name: 'Chip', hiddenVersions: [2], loadRoutes }], {
      chip: [
        { number: 1, folder: 'version-1', examples: ['basic'] },
        { number: 2, folder: 'version-2', examples: ['basic', 'raised'] },
      ],
    });
    expect(chip.versions.map((v) => v.number)).toEqual([1]);
    expect(chip.variants.map((v) => v.slug)).toEqual(['basic']);
    expect(findVersion(chip, '2')?.number).toBe(1);
  });

  it('documents example folders not listed in the config, after the listed ones', () => {
    const loadRoutes = () => Promise.resolve([]);
    const [chip] = resolveInventory(
      [
        {
          id: 'chip',
          name: 'Chip',
          variants: ['Outlined', { name: 'Draft', hidden: true }],
          loadRoutes,
        },
      ],
      {
        chip: [
          { number: 1, folder: 'version-1', examples: ['icons-border', 'outlined', 'draft'] },
          { number: 2, folder: 'version-2', examples: ['basic'] },
        ],
      },
    );
    expect(chip.variants.map((v) => [v.slug, v.name])).toEqual([
      ['outlined', 'Outlined'],
      ['basic', 'Basic'],
      ['icons-border', 'Icons Border'],
    ]);
    expect(chip.hiddenVariantIds).toEqual(['chip-draft']);
  });

  it('every component has at least its version-1 folder (unless that version is hidden)', () => {
    for (const component of CATALOG) {
      const hidden = COMPONENT_INVENTORY.find((d) => d.id === component.id)?.hiddenVersions ?? [];
      if (hidden.includes(1)) expect(component.versions.length).withContext(component.id).toBeGreaterThan(0);
      else expect(component.versions[0]?.folder).withContext(component.id).toBe('version-1');
    }
  });

  it('resolves variant path aliases by slug or full ID', () => {
    expect(findVariantInComponent('button', 'basic')?.id).toBe('button-basic');
    expect(findVariantInComponent('button', 'button-basic')?.id).toBe('button-basic');
    expect(findVariantInComponent('button', 'unknown')).toBeUndefined();
  });

  it('searches by component name only, ignoring case, accents and spaces', () => {
    expect(catalog.searchByName('file upload').map((c) => c.id)).toEqual(['file-upload']);
    expect(catalog.searchByName('TREE').map((c) => c.id)).toEqual([
      'tree-view',
      'tree-select',
      'tree-table',
    ]);
    expect(catalog.searchByName('basic')).toEqual([]); // variant names are not searched
    expect(catalog.searchByName('  ').length).toBe(CATALOG.length);
    expect(catalog.searchByName('zzz')).toEqual([]);
  });

  it('every component has a routes module with a default page', async () => {
    for (const component of CATALOG) {
      const module = (await component.loadRoutes()) as DefaultExport<Routes>;
      expect(module.default.some((r) => r.path === ''))
        .withContext(component.id)
        .toBeTrue();
    }
  });
});
