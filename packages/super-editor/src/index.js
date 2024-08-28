import { SuperConverter } from "@core/super-converter/SuperConverter";
import { makeDefaultItems } from '@/components/toolbar/defaultItems.js';
import { getMarksFromSelection, getActiveFormatting } from '@/core/helpers/getMarksFromSelection.js';
import { SuperToolbar } from '@components/toolbar/super-toolbar.js';
import DocxZipper from '@core/DocxZipper';
import SuperEditor from '@components/SuperEditor.vue';
import BasicUpload from './dev/components/BasicUpload.vue';
import Toolbar from '@components/toolbar/Toolbar.vue';
import SuperInput from '@components/SuperInput.vue';


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
  SuperToolbar,

  // Components
  SuperEditor,
  SuperInput,
  BasicUpload,
  Toolbar,

  // Helpers
  makeDefaultItems,
  getMarksFromSelection,
  getActiveFormatting
}