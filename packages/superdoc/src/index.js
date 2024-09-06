import { Superdoc } from './core/index.js';
import { 
  SuperInput, 
  helpers as superEditorHelpers, 
  fieldAnnotationHelpers 
} from '@harbour-enterprises/super-editor';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';

export { 
  Superdoc,
  BlankDOCX,

  // Allowed types
  DOCX,
  PDF,
  HTML,

  // Components
  SuperInput,

  // Helpers
  superEditorHelpers,
  fieldAnnotationHelpers,
}
