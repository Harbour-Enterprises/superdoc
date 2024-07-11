import { SuperConverter } from "@core/SuperConverter";
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
  faAlignLeft,
  faIndent,
  faEllipsisVertical,
  faList,
  faListNumeric,
  faCaretDown
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
  faIndent,
  faEllipsisVertical,
  faList,
  faListNumeric,
  faCaretDown
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