import './style.css';
import 'super-editor/style.css';
import '@common/icons/icons.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { useSuperdocStore } from './stores/superdoc-store';
import { DOCX, PDF, HTML } from '@common/document-types';
import { SuperToolbar } from '../../super-toolbar/super-toolbar';
import clickOutside from '@common/helpers/v-click-outside';
import App from './Superdoc.vue'

import BlankDOCX from '@common/data/blank.docx?url';

const createMyApp = () => {
  const app = createApp(App);
  const pinia = createPinia()
  app.use(pinia)
  app.directive('click-outside', clickOutside);

  const superdocStore = useSuperdocStore();
  return { app, pinia, superdocStore };
}

/* **
  * Superdoc class
  * Expects a config object
*/
class Superdoc extends EventEmitter {

  static allowedTypes = [DOCX, PDF, HTML];

  constructor(config) {
    super();

    config.documents = this.#preprocessDocuments(config.documents);
    this.log('Initializing:', config);

    const { app, pinia, superdocStore } = createMyApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = config;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;

    // Toolbar
    this.toolbarElement = config.toolbar;
    this.toolbar = null;

    this.superdocStore.init(config);
    this.activeEditor = null;

    // Directives
    this.app.mount(config.selector);

    // If a toolbar element is provided, render a toolbar
    if (this.toolbarElement) this.addToolbar(this);
  }

  #preprocessDocuments(documents) {
    return documents.map((doc) => {
      const { data } = doc;
  
      if (!(data instanceof File)) throw new Error('[superdoc] Documents in config must be File objects');
  
      const { type: documentType } = data;
      console.debug('[superdoc] Preprocessing document:', documentType);
      if (!Superdoc.allowedTypes.includes(documentType)) {
        const msg = `[superdoc] Invalid document type: ${documentType}. Allowed types: ${Superdoc.allowedTypes.join(', ')}`;
        throw new Error(msg);
      }
  
      return { ...doc, type: documentType };
    });
  }

  broadcastLoaded() {
    this.emit('ready');
  }

  broadcastComments(type, data) {
    this.log('[comments] Broadcasting:', type, data);
    this.emit('comments-update', type, data);
  }

  log(...args) {
    console.debug('🦋 🦸‍♀️ [superdoc]', ...args);
  }

  setActiveEditor(editor) {
    this.activeEditor = editor;
    if (this.toolbar) this.toolbar.setActiveEditor(editor);
  }

  addToolbar() {
    if (!this.toolbarElement) return;
    const config = {
      element: this.toolbarElement,
      onToolbarCommand: this.onToolbarCommand.bind(this),
    }
    this.toolbar = new SuperToolbar(config);
  }

  onToolbarCommand({ item, argument }) {
    this.log('Toolbar command:', item, argument);
  }

  // saveAll() {
  //   this.log('[superdoc] Saving all');
  //   const documents = this.superdocStore.documents;
  //   documents.forEach((doc) => {
  //     this.log('[superdoc] Saving:', doc.id, doc.core);
  //     doc.core.save();
  //   })
  // }

  destroy() {
    if (this.app) {
      this.log('[superdoc] Unmounting app');
      this.app.unmount();
    }

    delete this.app.config.globalProperties.$config;
    delete this.app.config.globalProperties.$superdoc;
  }
}


export { 
  Superdoc,
  BlankDOCX,

  // Allowed types
  DOCX,
  PDF,
  HTML,
}