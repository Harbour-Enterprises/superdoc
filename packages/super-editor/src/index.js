import './style.css';
import { SuperConverter } from "@core/super-converter/SuperConverter";
import { getMarksFromSelection } from '@/core/helpers/getMarksFromSelection.js';
import { getActiveFormatting } from '@/core/helpers/getActiveFormatting.js';
import { getStarterExtensions } from '@extensions/index.js';
import { SuperToolbar } from '@components/toolbar/super-toolbar.js';
import { DocxZipper, helpers } from '@core/index.js';
import { Editor } from '@core/Editor.js';
import SuperEditor from '@components/SuperEditor.vue';
import BasicUpload from './dev/components/BasicUpload.vue';
import Toolbar from '@components/toolbar/Toolbar.vue';
import SuperInput from '@components/SuperInput.vue';
import * as fieldAnnotationHelpers from '@extensions/field-annotation/fieldAnnotationHelpers/index.js';

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
  Editor,

  // Components
  SuperEditor,
  SuperInput,
  BasicUpload,
  Toolbar,

  // Helpers
  helpers,
  fieldAnnotationHelpers,
  getMarksFromSelection,
  getActiveFormatting,
  getStarterExtensions,
}
