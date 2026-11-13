import { ComponentDefinition } from '../service/catalog.model';
import accordion from './accordion/accordion.config';
import button from './button/button.config';
import dropdownSelect from './dropdown-select/dropdown-select.config';
import input from './input/input.config';
import fileUpload from './file-upload/file-upload.config';
import datePicker from './date-picker/date-picker.config';
import listBox from './list-box/list-box.config';
import dialogModal from './dialog-modal/dialog-modal.config';
import confirmDialogModal from './confirm-dialog-modal/confirm-dialog-modal.config';
import tabs from './tabs/tabs.config';
import tooltip from './tooltip/tooltip.config';
import tag from './tag/tag.config';
import popover from './popover/popover.config';
import alertas from './alertas/alertas.config';
import toggleSwitch from './toggle-switch/toggle-switch.config';
import slider from './slider/slider.config';
import treeView from './tree-view/tree-view.config';
import search from './search/search.config';
import stepper from './stepper/stepper.config';
import treeSelect from './tree-select/tree-select.config';
import dragAndDrop from './drag-and-drop/drag-and-drop.config';
import pickList from './pick-list/pick-list.config';
import table from './table/table.config';
import fileDrop from './file-drop/file-drop.config';
import carousel from './carousel/carousel.config';
import message from './message/message.config';
import multiselect from './multiselect/multiselect.config';
import timeline from './timeline/timeline.config';
import toast from './toast/toast.config';
import treetable from './treetable/treetable.config';
import card from './card/card.config';
import badge from './badge/badge.config';
import chip from './chip/chip.config';
import searchDropdown from './search-dropdown/search-dropdown.config';
import breadcrumb from './breadcrumb/breadcrumb.config';
import paginator from './paginator/paginator.config';
import inputotp from './inputotp/inputotp.config';
import password from './password/password.config';
import progressbar from './progressbar/progressbar.config';
import demo from './_demo_/demo.config';

/**
 * Registered components, in menu order (Excel "Listado de componentes a replicar").
 * Each component owns its documentation config in <id>/<id>.config.ts (name, variants, hidden);
 * this list only changes when a new component folder is created.
 * Reference implementations (`reference: true`) go first: the menu pins them above a divider.
 */
export const COMPONENT_INVENTORY: readonly ComponentDefinition[] = [
  demo, // reference implementation, not in the Excel
  accordion,
  button,
  dropdownSelect,
  input,
  fileUpload,
  datePicker,
  listBox,
  dialogModal,
  tabs,
  tooltip,
  tag,
  popover,
  alertas,
  confirmDialogModal,
  toggleSwitch,
  slider,
  treeView,
  search,
  stepper,
  treeSelect,
  dragAndDrop,
  pickList,
  table,
  fileDrop,
  carousel,
  message,
  multiselect,
  timeline,
  toast,
  treetable,
  card,
  badge,
  chip,
  searchDropdown,
  breadcrumb,
  paginator,
  inputotp,
  password,
  progressbar,
];
