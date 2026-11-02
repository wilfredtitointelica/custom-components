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
import pill from './pill/pill.config';
import popover from './popover/popover.config';
import alertas from './alertas/alertas.config';
import toggleSwitch from './toggle-switch/toggle-switch.config';
import slider from './slider/slider.config';
import treeView from './tree-view/tree-view.config';
import search from './search/search.config';
import stepper from './stepper/stepper.config';
import treeSelect from './tree-select/tree-select.config';
import dragAndDrop from './drag-and-drop/drag-and-drop.config';
import table from './table/table.config';
import fileDrop from './file-drop/file-drop.config';
import carousel from './carousel/carousel.config';
import message from './message/message.config';
import multiSelect from './multi-select/multi-select.config';
import timeline from './timeline/timeline.config';
import toast from './toast/toast.config';
import treeTable from './tree-table/tree-table.config';
import card from './card/card.config';
import badge from './badge/badge.config';
import chip from './chip/chip.config';
import tag from './tag/tag.config';
import searchDropdown from './search-dropdown/search-dropdown.config';
import breadcrumb from './breadcrumb/breadcrumb.config';
import paginator from './paginator/paginator.config';
import inputOtp from './input-otp/input-otp.config';
import password from './password/password.config';
import progressBar from './progress-bar/progress-bar.config';
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
  confirmDialogModal,
  tabs,
  tooltip,
  pill,
  popover,
  alertas,
  toggleSwitch,
  slider,
  treeView,
  search,
  stepper,
  treeSelect,
  dragAndDrop,
  table,
  fileDrop,
  carousel,
  message,
  multiSelect,
  timeline,
  toast,
  treeTable,
  card,
  badge,
  chip,
  tag,
  searchDropdown,
  breadcrumb,
  paginator,
  inputOtp,
  password,
  progressBar,
];
