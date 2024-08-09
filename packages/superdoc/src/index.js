import './style.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useSuperdocStore } from './stores/superdoc-store';
import { DOCX, PDF, HTML } from '@common/document-types';
import clickOutside from '@/helpers/v-click-outside';
import SuperToolbar from '@/components/SuperToolbar/SuperToolbar.vue';
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
  }

  addToolbar(instance) {
    if (!this.toolbarElement) return;

    if (this.toolbar) {
      console.debug('[superdoc] Unmounting existing toolbar');
      this.toolbar.unmount();
    }

    const el = document.getElementById(this.toolbarElement);
    if (!el) return;
    
    const app = createApp(SuperToolbar);
    app.config.globalProperties.$superdoc = instance;
    app.mount(el);
    this.toolbar = app;
  }

  onToolbarCommand({ command, argument }) {
    if (!command) return;

    if (command in this.activeEditor.commands) {
      this.activeEditor.commands[command](argument);
    } else { 
      console.error('[superdoc] Command not yet implemented:', command);
    }
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
  BlankDOCX
}