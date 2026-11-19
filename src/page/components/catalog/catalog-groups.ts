/**
 * Categories of the gallery (/components/catalog), by purpose, in display order. A component whose ID
 * is not listed here goes to the "Other" group at the end, so a new component always shows up.
 */
export const CATALOG_GROUPS: readonly { readonly name: string; readonly ids: readonly string[] }[] = [
  { name: 'Actions', ids: ['button', 'file-upload', 'drag-and-drop'] },
  {
    name: 'Inputs',
    ids: ['inputtext', 'inputnumber', 'inputotp', 'checkbox', 'radiobutton', 'password', 'search', 'search-dropdown'],
  },
  {
    name: 'Selection',
    ids: ['dropdown-select', 'multiselect', 'tree-select', 'list-box', 'toggle-switch', 'slider', 'datepicker'],
  },
  { name: 'Navigation', ids: ['breadcrumb', 'tabs', 'paginator', 'stepper'] },
  {
    name: 'Data & Containers',
    ids: ['card', 'accordion', 'dialog-modal', 'confirm-dialog-modal', 'carousel', 'table', 'treetable', 'tree-view', 'pick-list', 'timeline'],
  },
  {
    name: 'Feedback',
    ids: ['message', 'toast', 'tooltip', 'popover', 'badge', 'chip', 'tag', 'progressbar'],
  },
];

export const OTHER_GROUP = 'Other';

/**
 * Splits components into CATALOG_GROUPS, in display order; the ones not listed go to OTHER_GROUP at the
 * end. Empty groups are left out. Shared by the gallery and the side menu so both show the same groups.
 */
export function groupComponents<T extends { readonly id: string }>(
  components: readonly T[],
): { name: string; items: T[] }[] {
  const byId = new Map(components.map((c) => [c.id, c]));
  const grouped = CATALOG_GROUPS.map((group) => ({
    name: group.name,
    items: group.ids.flatMap((id) => {
      const component = byId.get(id);
      byId.delete(id);
      return component ? [component] : [];
    }),
  }));
  return [...grouped, { name: OTHER_GROUP, items: [...byId.values()] }].filter((g) => g.items.length);
}

/** primeicons class shown in the preview of each card; unknown IDs fall back to DEFAULT_ICON. */
export const CATALOG_ICONS: Readonly<Record<string, string>> = {
  button: 'pi-stop',
  'file-upload': 'pi-cloud-upload',
  'drag-and-drop': 'pi-arrows-alt',
  inputtext: 'pi-pen-to-square',
  inputnumber: 'pi-calculator',
  password: 'pi-lock',
  inputotp: 'pi-key',
  checkbox: 'pi-check-square',
  radiobutton: 'pi-circle',
  search: 'pi-search',
  'search-dropdown': 'pi-search-plus',
  'dropdown-select': 'pi-chevron-circle-down',
  multiselect: 'pi-list-check',
  'tree-select': 'pi-sitemap',
  'list-box': 'pi-list',
  'pick-list': 'pi-arrow-right-arrow-left',
  'toggle-switch': 'pi-circle-on',
  slider: 'pi-sliders-h',
  datepicker: 'pi-calendar',
  breadcrumb: 'pi-angle-double-right',
  tabs: 'pi-folder-open',
  paginator: 'pi-ellipsis-h',
  stepper: 'pi-step-forward',
  card: 'pi-id-card',
  accordion: 'pi-bars',
  'dialog-modal': 'pi-window-maximize',
  'confirm-dialog-modal': 'pi-question-circle',
  carousel: 'pi-images',
  table: 'pi-table',
  treetable: 'pi-objects-column',
  'tree-view': 'pi-sitemap',
  timeline: 'pi-history',
  message: 'pi-info-circle',
  toast: 'pi-bell',
  tooltip: 'pi-comment',
  popover: 'pi-clone',
  badge: 'pi-hashtag',
  chip: 'pi-user',
  tag: 'pi-bookmark',
  progressbar: 'pi-chart-bar',
};

export const DEFAULT_ICON = 'pi-box';
