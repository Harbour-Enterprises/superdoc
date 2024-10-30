import { Superdoc } from './core/index.js';
import { SuperConverter } from '@harbour-enterprises/super-editor';

import { 
  SuperInput, 
  helpers as superEditorHelpers, 
  fieldAnnotationHelpers 
} from '@harbour-enterprises/super-editor';
import { DOCX, PDF, HTML, getFileObject } from '@harbour-enterprises/common';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';

export { 
  Superdoc,
  BlankDOCX,
  getFileObject,

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
}
