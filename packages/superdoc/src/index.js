import { Superdoc } from './core/index.js';
import { SuperConverter, Editor, getRichTextExtensions } from '@harbour-enterprises/super-editor';
import { createZip } from '@harbour-enterprises/super-editor/zipper';

import { 
  SuperInput, 
  helpers as superEditorHelpers, 
  fieldAnnotationHelpers 
} from '@harbour-enterprises/super-editor';
import { DOCX, PDF, HTML, getFileObject, compareVersions } from '@harbour-enterprises/common';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';

export { 
  Superdoc,
  BlankDOCX,
  getFileObject,
  compareVersions,
  Editor,
  getRichTextExtensions,

  // Allowed types
  DOCX,
  PDF,
  HTML,

  // Components
  SuperInput,

  // Helpers
  superEditorHelpers,
  fieldAnnotationHelpers,

  // Super Editor
  SuperConverter,
  createZip,
}
