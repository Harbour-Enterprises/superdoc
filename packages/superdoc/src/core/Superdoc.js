// TODO: side-effect with styles
import '../style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';

import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Doc } from 'yjs';

import { useSuperdocStore } from '../stores/superdoc-store';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperToolbar } from '@harbour-enterprises/super-editor';
import { vClickOutside } from '@harbour-enterprises/common';
import { createAwarenessHandler, createProvider } from './collaboration/collaboration';
import App from '../Superdoc.vue';

const createVueApp = () => {
  const app = createApp(App);
  const pinia = createPinia()
  app.use(pinia)
  app.directive('click-outside', vClickOutside);

  const superdocStore = useSuperdocStore();
  return { app, pinia, superdocStore };
};

/* **
  * Superdoc class
  * Expects a config object
*/
export class Superdoc extends EventEmitter {

  static allowedTypes = [DOCX, PDF, HTML];

  config;

  documentMode;

  constructor(config) {
    super();
    this.config = config;
    this.#init(config);
  }

  #init(config) {
    this.destroy();

    this.documentMode = config.documentMode || 'viewing';

    this.#preprocessDocuments(config.documents);
    this.#initCollaboration(config.modules.collaboration);
    config.documents = this.documents;

    const { app, pinia, superdocStore } = createVueApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = config;
    this.app.config.globalProperties.$documentMode = this.documentMode;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;

    // Toolbar
    this.toolbarElement = config.toolbar;
    this.toolbar = null;

    this.superdocStore.init(config);
    this.activeEditor = null;

    // Directives
    this.app.mount(config.selector);

    this.users = [
      { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
      { name: 'Artem Nistuley', email: 'nick@harbourshare.com' },
      { name: 'Matthew Connelly', email: 'matthew@harbourshare.com' },
      { name: 'Eric Doversberger', email: 'eric@harbourshare.com' }
    ]

    // If a toolbar element is provided, render a toolbar
    this.addToolbar(this);
  }

  #preprocessDocuments(documents) {
    this.documents = documents.map((doc) => {
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

  /* **
    * Initialize collaboration if configured
    * @param {Object} config
  */
  async #initCollaboration(collaborationModuleConfig) {
    if (!collaborationModuleConfig) return;
    const handleAwarenessChange = createAwarenessHandler(this);
    this.documents.forEach((doc) => {
      doc.ydoc = new Doc();
      doc.provider = createProvider(collaborationModuleConfig, doc.ydoc, this.user);
      doc.provider.awareness.on('update', handleAwarenessChange);
    });
  }

  broadcastEditorCreate(editor) {
    this.emit('editorCreate', { editor });
  }

  broadcastEditorDestroy() {
    this.emit('editorDestroy');
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
    const config = {
      element: this.toolbarElement || null,
      onToolbarCommand: this.onToolbarCommand.bind(this),
    }
    this.toolbar = new SuperToolbar(config);
    this.toolbar.on('superdoc-command', this.onToolbarCommand.bind(this));
  }

  onToolbarCommand({ item, argument }) {
    this.log('[superdoc] Toolbar command:', item, argument);
    if (item.command === 'setDocumentMode') {
      this.setDocumentMode(argument);
    }
  }

  setDocumentMode(type) {
    if (!type) return;

    type = type.toLowerCase();
    this.config.documentMode = type;

    const types = {
      viewing: () => this.#setModeViewing(),
      editing: () => this.#setModeEditing(),
      suggesting: () => this.#setModeSuggesting(),
    }

    if (types[type]) types[type]();
  }

  #setModeEditing() {
    this.superdocStore.documents.forEach((doc) => {
      doc.restoreComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('editing');
    });
  }

  #setModeSuggesting() {
    // TODO - Need to wait for tracked changes to finish this
    this.superdocStore.documents.forEach((doc) => {
      doc.restoreComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('suggesting');
    });
  }''

  #setModeViewing() {
    this.superdocStore.documents.forEach((doc) => {
      doc.removeComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('viewing');
    });
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
    if (!this.app) return;
    this.log('[superdoc] Unmounting app');
    this.app.unmount();
    this.removeAllListeners();
    delete this.app.config.globalProperties.$config;
    delete this.app.config.globalProperties.$superdoc;
  }
}
