// TODO: side-effect with styles
import '../style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';

import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Doc as YDoc, Array as YArray } from 'yjs';
import { v4 as uuidv4 } from 'uuid';

import { useSuperdocStore } from '../stores/superdoc-store';
import { DOCX, PDF, HTML, documentTypes } from '@harbour-enterprises/common';
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

  version;

  constructor(config) {
    super();
    this.config = config;

    this.config.toolbarGroups = this.config.toolbarGroups || ['left', 'center', 'right'];
    this.#init(config);
  }

  async #init(config) {
    this.destroy();

    this.documentMode = config.documentMode || 'viewing';

    this.superdocId = config.superdocId || uuidv4();
    console.debug('🦋 [superdoc] Superdoc ID:', this.superdocId);

    this.documents = this.#preprocessDocuments(config.documents);
    await this.#initCollaboration(config.modules.collaboration);

    config.documents = this.documents;

    const { app, pinia, superdocStore } = createVueApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = config;
    this.app.config.globalProperties.$documentMode = this.documentMode;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;
    this.version = config.version;

    // Current user
    this.user = config.user;

    // Toolbar
    this.toolbarElement = config.toolbar;
    this.toolbar = null;

    this.superdocStore.init(config);
    this.activeEditor = null;

    // Directives
    this.app.mount(config.selector);

    // Required editors
    this.readyEditors = 0;

    this.users = config.users || [];
    this.isLocked = config.isLocked || false;
    this.lockedBy = config.lockedBy || null;

    // If a toolbar element is provided, render a toolbar
    this.addToolbar(this);

    // TODO: Remove this - debugging only
    window.superdoc = this;
  }
  get requiredNumberOfEditors() {
    return this.superdocStore.documents.filter((d) => d.type === DOCX).length;
  }


  get state() {
    return {
      documents: this.superdocStore.documents,
      users: this.users,
    }
  }

  

  #preprocessDocuments(documents) {
    console.debug('🦋 [superdoc] Preprocessing documents:', documents);
    if (!documents) return [];

    return documents.map((doc) => {
      const { data: documentFile } = doc;

      let documentType;
      if (doc.type) {
        documentType = documentTypes[doc.type];
      }
      else if (documentFile) {
        documentType = documentFile?.type;
      }

      return { ...doc, type: documentType };
    });
  }

  broadcastDocumentReady() {
    this.emit('document-ready');
  }

  /* **
    * Initialize collaboration if configured
    * @param {Object} config
  */
  async #initCollaboration(collaborationModuleConfig) {
    if (!collaborationModuleConfig) return;

    // Initialize global superdoc sync - for comments, etc.
    // this.ydoc = new YDoc();
    // const options = {
    //   config: collaborationModuleConfig,
    //   ydoc: this.ydoc,
    //   user: this.config.user,
    //   documentId: this.superdocId
    // };
    // this.provider = createProvider(options);
    // this.log('[superdoc] Provider:', options);

    // Initialize individual document sync
    const processedDocuments = [];
    this.documents.forEach((doc) => {

      const options = {
        config: collaborationModuleConfig,
        user: this.config.user,
        documentId: doc.id,
      };

      const { provider, socket, ydoc } = createProvider(options);
      doc.provider = provider;
      doc.socket = socket;
      doc.ydoc = ydoc;
      provider.on('awarenessUpdate', ({ states }) => createAwarenessHandler(this, states));

      console.debug('🦋 [superdoc] Document:', doc);
      processedDocuments.push(doc);
    });

    this.documents = processedDocuments;
  }

  // exportEditorsAsYdocUpdates() {
  //   const updates = [];
  //   this.superdocStore.documents.forEach((doc) => {
  //     const editor = doc.getEditor();
  //     if (editor) {
  //       const json = editor.getJSON();
  //       const ydoc = prosemirrorToYDoc(editor.state.doc);      
  //       const updateData = encodeStateAsUpdate(ydoc);
  //       updates.push(updateData);
  //     }
  //   })

  //   console.debug('🦋 [superdoc] Exporting updates:', updates);
  //   return updates;
  // }

  broadcastReady() {
    if (this.readyEditors === this.requiredNumberOfEditors) {
      this.emit('ready', { superdoc: this });
    }
  }

  broadcastEditorCreate(editor) {
    this.readyEditors++;
    this.broadcastReady();
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
      isDev: false,
      toolbarGroups: this.config.toolbarGroups,
    }

    this.toolbar = new SuperToolbar(config);
    this.toolbar.on('superdoc-command', this.onToolbarCommand.bind(this));
  }

  onToolbarCommand({ item, argument }) {
    if (item.command === 'setDocumentMode') {
      this.setDocumentMode(argument);
    } else if (item.command === 'setZoom') {
      this.superdocStore.activeZoom = argument;
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
    this.superdocStore.documents.forEach((doc) => {
      doc.restoreComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('suggesting');
    });
  }

  #setModeViewing() {
    this.superdocStore.documents.forEach((doc) => {
      doc.removeComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('viewing');
    });
  }

  /**
   * Set the document to locked or unlocked
   * @param {boolean} lock 
   */
  setLocked(lock = true) {
    this.config.documents.forEach((doc) => {
      const metaMap = doc.ydoc.getMap('meta');
      doc.ydoc.transact(() => {
        metaMap.set('locked', lock);
        metaMap.set('lockedBy', this.user);
      });
    });
  }

  lockSuperdoc(isLocked = false, lockedBy) {
    this.isLocked = isLocked;
    this.lockedBy = lockedBy;
    console.debug('🦋 [superdoc] Locking superdoc:', isLocked, lockedBy, '\n\n\n');
    this.emit('locked', { isLocked, lockedBy });
  }

  async exportEditorsToDOCX() {
    console.debug('🦋 [superdoc] Exporting editors to DOCX');
    const docxPromises = [];
    this.superdocStore.documents.forEach((doc) => {
      const editor = doc.getEditor();
      if (editor) {
        docxPromises.push(editor.exportDocx());
      }
    });
    return await Promise.all(docxPromises);
  }

  async #triggerCollaborationSaves() {
    console.debug('🦋 [superdoc] Triggering collaboration saves');
    return new Promise((resolve, reject) => {
      this.superdocStore.documents.forEach((doc) => {
        this.pendingCollaborationSaves = 0;
        if (doc.ydoc) {
          this.pendingCollaborationSaves++;
          const metaMap = doc.ydoc.getMap('meta');
          metaMap.observe((event) => {
            if (event.changes.keys.has('immediate-save-finished')) {
              this.pendingCollaborationSaves--;
              if (this.pendingCollaborationSaves <= 0) {
                resolve();
              }
            }
          });
          metaMap.set('immediate-save', true);
        };
      });
    });
  }

  async save() {
    const savePromises = [
      this.#triggerCollaborationSaves(),
      this.exportEditorsToDOCX(),
    ];
    const result = await Promise.all(savePromises);
    return result;
  };

  destroy() {
    if (!this.app) return;
    this.log('[superdoc] Unmounting app');
    this.app.unmount();
    this.removeAllListeners();
    delete this.app.config.globalProperties.$config;
    delete this.app.config.globalProperties.$superdoc;
  }
}
