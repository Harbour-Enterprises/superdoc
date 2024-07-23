import { SuperConverter } from "@core/super-converter/SuperConverter";
import DocxZipper from '@core/DocxZipper';
import SuperEditor from '@components/SuperEditor.vue';
import BasicUpload from './dev/components/BasicUpload.vue';
import Toolbar from '@components/toolbar/Toolbar.vue';

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faItalic,
  faUnderline,
  faStrikethrough,
  faBold,
  faGripLinesVertical,
  faFont,
  faLink,
  faImage,
  faIndent,
  faEllipsisVertical,
  faList,
  faListNumeric,
  faCaretDown,
  faCaretUp,
  faAngleRight,
  faRotateLeft,
  faRotateRight,
  faMagnifyingGlass,
  faCircle,
  faAlignLeft,
  faAlignRight,
  faAlignCenter,
  faAlignJustify
} from '@fortawesome/free-solid-svg-icons';


library.add(
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faGripLinesVertical,
  faFont,
  faLink,
  faImage,
  faAlignLeft,
  faAlignRight,
  faAlignCenter,
  faAlignJustify,
  faIndent,
  faEllipsisVertical,
  faList,
  faListNumeric,
  faCaretDown,
  faCaretUp,
  faAngleRight,
  faRotateLeft,
  faRotateRight,
  faMagnifyingGlass,
  faCircle
);

/**
 * Exported classes and components.
 * @module exports
 * @see SuperConverter
 * @see DocxZipper
 * @see SuperEditor
 * @see Toolbar
 */
export {
  // Classes
  SuperConverter,
  DocxZipper,

  // Components
  SuperEditor,
  BasicUpload,
  Toolbar
}