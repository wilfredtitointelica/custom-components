/**
 * Categories of the gallery (/components/catalog), by purpose, in display order. A component whose ID
 * is not listed here goes to the "Otros" group at the end, so a new component always shows up.
 */
export const CATALOG_GROUPS: readonly { readonly name: string; readonly ids: readonly string[] }[] = [
  { name: 'Acciones', ids: ['button', 'file-upload', 'file-drop', 'drag-and-drop'] },
  { name: 'Entrada de texto', ids: ['input', 'password', 'input-otp', 'search', 'search-dropdown'] },
  {
    name: 'Selección',
    ids: ['dropdown-select', 'multi-select', 'tree-select', 'list-box', 'toggle-switch', 'slider', 'date-picker'],
  },
  { name: 'Navegación', ids: ['breadcrumb', 'tabs', 'paginator', 'stepper'] },
  {
    name: 'Contención',
    ids: ['card', 'accordion', 'dialog-modal', 'confirm-dialog-modal', 'carousel', 'table', 'tree-table', 'tree-view', 'timeline'],
  },
  {
    name: 'Comunicación',
    ids: ['alertas', 'message', 'toast', 'tooltip', 'popover', 'badge', 'chip', 'tag', 'pill', 'progress-bar'],
  },
];

export const OTHER_GROUP = 'Otros';

/** primeicons class shown in the preview of each card; unknown IDs fall back to DEFAULT_ICON. */
export const CATALOG_ICONS: Readonly<Record<string, string>> = {
  button: 'pi-stop',
  'file-upload': 'pi-cloud-upload',
  'file-drop': 'pi-file-arrow-up',
  'drag-and-drop': 'pi-arrows-alt',
  input: 'pi-pen-to-square',
  password: 'pi-lock',
  'input-otp': 'pi-key',
  search: 'pi-search',
  'search-dropdown': 'pi-search-plus',
  'dropdown-select': 'pi-chevron-circle-down',
  'multi-select': 'pi-list-check',
  'tree-select': 'pi-sitemap',
  'list-box': 'pi-list',
  'toggle-switch': 'pi-circle-on',
  slider: 'pi-sliders-h',
  'date-picker': 'pi-calendar',
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
  'tree-table': 'pi-objects-column',
  'tree-view': 'pi-sitemap',
  timeline: 'pi-history',
  alertas: 'pi-exclamation-circle',
  message: 'pi-info-circle',
  toast: 'pi-bell',
  tooltip: 'pi-comment',
  popover: 'pi-clone',
  badge: 'pi-hashtag',
  chip: 'pi-user',
  tag: 'pi-bookmark',
  pill: 'pi-tag',
  'progress-bar': 'pi-chart-bar',
};

export const DEFAULT_ICON = 'pi-box';
