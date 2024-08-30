import './style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';
import { Superdoc } from './core/index.js';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperInput } from '@harbour-enterprises/super-editor';
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
}
