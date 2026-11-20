import { ComponentDefinition } from '../service/catalog.model';
import accordion from './accordion/accordion.config';
import button from './button/button.config';
import select from './select/select.config';
import inputtext from './inputtext/inputtext.config';
import inputnumber from './inputnumber/inputnumber.config';
import checkbox from './checkbox/checkbox.config';
import radiobutton from './radiobutton/radiobutton.config';
import fileupload from './fileupload/fileupload.config';
import datepicker from './datepicker/datepicker.config';
import listbox from './listbox/listbox.config';
import dialog from './dialog/dialog.config';
import confirmdialog from './confirmdialog/confirmdialog.config';
import tabs from './tabs/tabs.config';
import tooltip from './tooltip/tooltip.config';
import tag from './tag/tag.config';
import popover from './popover/popover.config';
import toggleswitch from './toggleswitch/toggleswitch.config';
import slider from './slider/slider.config';
import treeview from './treeview/treeview.config';
import search from './search/search.config';
import stepper from './stepper/stepper.config';
import treeselect from './treeselect/treeselect.config';
import draganddrop from './draganddrop/draganddrop.config';
import picklist from './picklist/picklist.config';
import table from './table/table.config';
import carousel from './carousel/carousel.config';
import message from './message/message.config';
import multiselect from './multiselect/multiselect.config';
import timeline from './timeline/timeline.config';
import toast from './toast/toast.config';
import treetable from './treetable/treetable.config';
import card from './card/card.config';
import badge from './badge/badge.config';
import chip from './chip/chip.config';
import searchdropdown from './searchdropdown/searchdropdown.config';
import breadcrumb from './breadcrumb/breadcrumb.config';
import paginator from './paginator/paginator.config';
import inputotp from './inputotp/inputotp.config';
import password from './password/password.config';
import progressbar from './progressbar/progressbar.config';
import demo from './_demo_/demo.config';

/**
 * Registered components, in menu order (Excel "Listado de componentes a replicar"; the input family
 * — inputtext, inputnumber, inputotp, checkbox, radiobutton — goes together).
 * Each component owns its documentation config in <id>/<id>.config.ts (name, variants, hidden);
 * this list only changes when a new component folder is created.
 * Reference implementations (`reference: true`) go first: the menu pins them above a divider.
 */
export const COMPONENT_INVENTORY: readonly ComponentDefinition[] = [
  demo, // reference implementation, not in the Excel
  accordion,
  button,
  select,
  inputtext,
  inputnumber,
  inputotp,
  checkbox,
  radiobutton,
  fileupload,
  datepicker,
  listbox,
  dialog,
  tabs,
  tooltip,
  tag,
  popover,
  confirmdialog,
  toggleswitch,
  slider,
  treeview,
  search,
  stepper,
  treeselect,
  draganddrop,
  picklist,
  table,
  carousel,
  message,
  multiselect,
  timeline,
  toast,
  treetable,
  card,
  badge,
  chip,
  searchdropdown,
  breadcrumb,
  paginator,
  password,
  progressbar,
];
