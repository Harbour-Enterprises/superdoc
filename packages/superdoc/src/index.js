import './style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initializeApp } from 'firebase/app';
// import { FirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import { Doc } from 'yjs';
import { Superdoc } from './core/index.js';

import { useSuperdocStore } from './stores/superdoc-store';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperToolbar } from '@harbour-enterprises/super-editor';
import { SuperInput } from '@harbour-enterprises/super-editor';
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
}
