import './style.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { useSuperdocStore } from './stores/superdoc-store';
import { DOCX, PDF, HTML } from '@common/document-types';
import clickOutside from '@common/helpers/v-click-outside';
import { SuperToolbar } from '../../super-toolbar/super-toolbar';
import App from './Superdoc.vue'
import library from '@/helpers/import-icons';

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
    console.debug('[superdoc] Initializing:', config);

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
    console.debug('[comments] Broadcasting:', type, data);
    this.emit('comments-update', type, data);
  }

  onSelectionUpdate({ editor, transaction }) {
    this.activeEditor = editor;
    this.emit('selection-update', { editor, transaction });
    console.debug('[superdoc] Selection update:', editor, transaction);
  }

  addToolbar() {
    if (!this.toolbarElement) return;
    const el = document.getElementById(this.toolbarElement);
    if (!el) return;

    const config = {
      element: el,
      onToolbarCommand: this.onToolbarCommand.bind(this),
    }
    this.toolbar = new SuperToolbar(config);
  }

  onToolbarCommand({ item, argument }) {
    const { command } = item;
    if (!command) return;

    console.debug('[superdoc] Toolbar command:', command, argument);
    if (command in this.activeEditor.commands) this.activeEditor.commands[command](argument);
    else throw new Error('[superdoc] Command not yet implemented:', command);
  }

  saveAll() {
    console.debug('[superdoc] Saving all');
    const documents = this.superdocStore.documents;
    documents.forEach((doc) => {
      console.debug('[superdoc] Saving:', doc.id, doc.core);
      doc.core.save();
    })
  }

  destroy() {
    if (this.toolbar) {
      console.debug('[superdoc] Unmounting toolbar');
      this.toolbar.unmount();
    }

    if (this.app) {
      console.debug('[superdoc] Unmounting app');
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