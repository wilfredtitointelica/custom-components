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
