import { ComponentDefinition } from './catalog.model';

/**
 * Component inventory — single source for the side menu, the routes and the search.
 *
 * Names and order come verbatim from the Excel "Listado de componentes a replicar".
 * Variants are only declared where a reference defines them:
 *  - Button: sections of the current Intelica Components "Buttons" page (screenshots).
 *  - Input, Tabs: the values listed in parentheses in the Excel.
 * Every other component has no variants until its author defines them.
 */
export const COMPONENT_INVENTORY: readonly ComponentDefinition[] = [
  { id: 'accordion', name: 'Accordion', loadRoutes: () => import('../components/accordion/routes') },
  {
    id: 'button',
    name: 'Button',
    variants: ['Basic', 'Disabled', 'Text', 'Icons + Border', 'Text Icons', 'Export', 'Filter'],
    loadRoutes: () => import('../components/button/routes'),
  },
  { id: 'dropdown-select', name: 'Dropdown / Select', loadRoutes: () => import('../components/dropdown-select/routes') },
  {
    id: 'input',
    name: 'Input (InputText, Checkbox, RadioButton, Textarea)',
    variants: [{ name: 'InputText', slug: 'text' }, 'Checkbox', 'RadioButton', 'Textarea'],
    loadRoutes: () => import('../components/input/routes'),
  },
  { id: 'file-upload', name: 'FileUpload', loadRoutes: () => import('../components/file-upload/routes') },
  { id: 'date-picker', name: 'DatePicker', loadRoutes: () => import('../components/date-picker/routes') },
  { id: 'list-box', name: 'ListBox', loadRoutes: () => import('../components/list-box/routes') },
  { id: 'dialog-modal', name: 'Dialog / Modal', loadRoutes: () => import('../components/dialog-modal/routes') },
  {
    id: 'tabs',
    name: 'Tabs (V1 / V2)',
    variants: ['V1', 'V2'],
    loadRoutes: () => import('../components/tabs/routes'),
  },
  { id: 'tooltip', name: 'Tooltip', loadRoutes: () => import('../components/tooltip/routes') },
  { id: 'pill', name: 'Pill', loadRoutes: () => import('../components/pill/routes') },
  { id: 'popover', name: 'Popover', loadRoutes: () => import('../components/popover/routes') },
  { id: 'alertas', name: 'Alertas', loadRoutes: () => import('../components/alertas/routes') },
  { id: 'toggle-switch', name: 'ToggleSwitch', loadRoutes: () => import('../components/toggle-switch/routes') },
  { id: 'slider', name: 'Slider', loadRoutes: () => import('../components/slider/routes') },
  { id: 'tree-view', name: 'TreeView', loadRoutes: () => import('../components/tree-view/routes') },
  { id: 'search', name: 'Search', loadRoutes: () => import('../components/search/routes') },
  { id: 'stepper', name: 'Stepper', loadRoutes: () => import('../components/stepper/routes') },
  { id: 'tree-select', name: 'TreeSelect', loadRoutes: () => import('../components/tree-select/routes') },
  { id: 'drag-and-drop', name: 'Drag and Drop', loadRoutes: () => import('../components/drag-and-drop/routes') },
  { id: 'table', name: 'Table', loadRoutes: () => import('../components/table/routes') },
  { id: 'file-drop', name: 'FileDrop', loadRoutes: () => import('../components/file-drop/routes') },
  { id: 'carousel', name: 'Carousel', loadRoutes: () => import('../components/carousel/routes') },
  { id: 'message', name: 'Message', loadRoutes: () => import('../components/message/routes') },
  { id: 'multi-select', name: 'MultiSelect', loadRoutes: () => import('../components/multi-select/routes') },
  { id: 'timeline', name: 'Timeline', loadRoutes: () => import('../components/timeline/routes') },
  { id: 'toast', name: 'Toast', loadRoutes: () => import('../components/toast/routes') },
  { id: 'tree-table', name: 'TreeTable', loadRoutes: () => import('../components/tree-table/routes') },
  { id: 'card', name: 'Card', loadRoutes: () => import('../components/card/routes') },
  { id: 'badge', name: 'Badge', loadRoutes: () => import('../components/badge/routes') },
  { id: 'search-dropdown', name: 'Search Dropdown', loadRoutes: () => import('../components/search-dropdown/routes') },
  { id: 'breadcrumb', name: 'Breadcrumb', loadRoutes: () => import('../components/breadcrumb/routes') },
  { id: 'paginator', name: 'Paginator', loadRoutes: () => import('../components/paginator/routes') },
  { id: 'input-otp', name: 'InputOTP', loadRoutes: () => import('../components/input-otp/routes') },
  { id: 'password', name: 'Password', loadRoutes: () => import('../components/password/routes') },
  { id: 'progress-bar', name: 'ProgressBar', loadRoutes: () => import('../components/progress-bar/routes') },
];
