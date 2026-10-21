import { DefaultExport, Routes } from '@angular/router';

import { CATALOG, ComponentCatalog, findVariantInComponent, resolveInventory } from './component-catalog';

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

describe('Component catalog', () => {
  const catalog = new ComponentCatalog();

  it('lists exactly the Excel components, in the Excel order', () => {
    expect(CATALOG.map((c) => c.name)).toEqual(EXCEL_NAMES);
  });

  it('builds unique, URL-safe IDs for components and variants', () => {
    const ids = CATALOG.flatMap((c) => [c.id, ...c.variants.map((v) => v.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('derives variant IDs from the component ID', () => {
    expect(catalog.find('button')!.variants.map((v) => v.id)).toEqual([
      'button-basic',
      'button-disabled',
      'button-text',
      'button-icons-border',
      'button-text-icons',
      'button-export',
      'button-filter',
    ]);
    expect(catalog.find('input')!.variants.map((v) => v.id)).toEqual([
      'input-text',
      'input-checkbox',
      'input-radio-button',
      'input-textarea',
    ]);
  });

  it('rejects colliding IDs', () => {
    const loadRoutes = () => Promise.resolve([]);
    expect(() =>
      resolveInventory([
        { id: 'search', name: 'Search', variants: ['Dropdown'], loadRoutes },
        { id: 'search-dropdown', name: 'Search Dropdown', loadRoutes },
      ]),
    ).toThrowError(/Duplicated ID "search-dropdown"/);
  });

  it('resolves variant path aliases by slug or full ID', () => {
    expect(findVariantInComponent('button', 'icons-border')?.id).toBe('button-icons-border');
    expect(findVariantInComponent('button', 'button-basic')?.id).toBe('button-basic');
    expect(findVariantInComponent('button', 'unknown')).toBeUndefined();
  });

  it('searches by component name only, ignoring case, accents and spaces', () => {
    expect(catalog.searchByName('file upload').map((c) => c.id)).toEqual(['file-upload']);
    expect(catalog.searchByName('TREE').map((c) => c.id)).toEqual(['tree-view', 'tree-select', 'tree-table']);
    expect(catalog.searchByName('basic')).toEqual([]); // variant names are not searched
    expect(catalog.searchByName('  ').length).toBe(CATALOG.length);
    expect(catalog.searchByName('zzz')).toEqual([]);
  });

  it('every component has a routes module with a default page', async () => {
    for (const component of CATALOG) {
      const module = (await component.loadRoutes()) as DefaultExport<Routes>;
      expect(module.default.some((r) => r.path === '')).withContext(component.id).toBeTrue();
    }
  });
});
