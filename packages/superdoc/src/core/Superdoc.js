// TODO: side-effect with styles
import '../style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';

import EventEmitter from 'eventemitter3'
import { Doc as YDoc, Array as YArray } from 'yjs';
import { v4 as uuidv4 } from 'uuid';
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperToolbar } from '@harbour-enterprises/super-editor';
import { createAwarenessHandler, createProvider } from './collaboration/collaboration';
import { createSuperdocVueApp } from './create-app';


/**
 * @typedef {Object} SuperdocUser The current user of this superdoc
 * @property {string} name The user's name
 * @property {string} email The user's email
 * @property {string | null} image The user's photo
 */


/* **
  * Superdoc class
  * Expects a config object
*/
export class Superdoc extends EventEmitter {

  static allowedTypes = [DOCX, PDF, HTML];

  config;

  version;

  documentMode;

  version;

  config = {
    superdocId: null,
    selector: '#superdoc', // The selector to mount the superdoc into
    documentMode: 'viewing',
    documents: [], // The documents to load

    user: { name: null, email: null }, // The current user of this superdoc
    users: [], // Optional: All users of this superdoc (can be used for @-mentions)

    modules: {}, // Optional: Modules to load

    // toolbar config
    toolbar: null, // Optional DOM element to render the toolbar in
    toolbarGroups: ['left', 'center', 'right'],

    isDev: false,

    // Events
    onEditorCreate: () => null,
    onEditorDestroy: () => null,
    onReady: () => null,
    onCommentsUpdate: () => null,
    onAwarenessUpdate: () => null,
    onLocked: () => null,

    // Image upload handler
    // async (file) => url;
    handleImageUpload: null,
  };

  constructor(config) {
    super();
    this.#init(config);
  }

  async #init(config) {
    this.config = {
      ...this.config,
      ...config
    }

    this.version = __APP_VERSION__;
    this.superdocId = config.superdocId || uuidv4();

    // Initialize collaboration if configured
    await this.#initCollaboration(this.config.modules);

    this.#initVueApp();
    this.#initListeners();

    this.user = this.config.user; // The current user
    this.users = this.config.users || []; // All users who have access to this superdoc
    this.socket = null;

    // Toolbar
    this.toolbarElement = this.config.toolbar;
    this.toolbar = null;
    this.isDev = this.config.isDev || false;

    this.activeEditor = null;

    this.app.mount(this.config.selector);

    // Required editors
    this.readyEditors = 0;

    this.isLocked = this.config.isLocked || false;
    this.lockedBy = this.config.lockedBy || null;

    // If a toolbar element is provided, render a toolbar
    this.addToolbar(this);
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

  #initVueApp() {
    const { app, pinia, superdocStore } = createSuperdocVueApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = this.config;
    this.app.config.globalProperties.$documentMode = this.documentMode;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;
    this.version = this.config.version;
    this.superdocStore.init(this.config);
  }

  #initListeners() {
    this.on('editorCreate', this.config.onEditorCreate);
    this.on('editorDestroy', this.config.onEditorDestroy);
    this.on('ready', this.config.onReady);
    this.on('comments-update', this.config.onCommentsUpdate);
    this.on('awareness-update', this.config.onAwarenessUpdate);
    this.on('locked', this.config.onLocked);
  }



  /* **
    * Initialize collaboration if configured
    * @param {Object} config
  */
  async #initCollaboration({ collaboration: collaborationModuleConfig } = {}) {
    if (!collaborationModuleConfig) return this.config.documents;

    this.socket = new HocuspocusProviderWebsocket({
      url: collaborationModuleConfig.url,
    });

    // Initialize global superdoc sync - for comments, etc.
    // TODO: Leaving it in here for reference as this will be complete soon.
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
    this.config.documents.forEach((doc) => {

      const options = {
        config: collaborationModuleConfig,
        user: this.config.user,
        documentId: doc.id,
        socket: this.socket,
      };

      const { provider, ydoc } = createProvider(options);
      doc.provider = provider;
      doc.socket = this.socket;
      doc.ydoc = ydoc;
      provider.on('awarenessUpdate', ({ states }) => createAwarenessHandler(this, states));

      console.debug('🦋 [superdoc] Document:', doc);
      processedDocuments.push(doc);
    });

    return processedDocuments;
  }

  broadcastDocumentReady() {
    this.emit('document-ready');
  }

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
      isDev: this.isDev || false,
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

  getHTML() {
    const editors = []
    this.superdocStore.documents.forEach((doc) => {
      const editor = doc.getEditor();
      if (editor) {
        editors.push(editor);
      }
    });

    return editors.map((editor) => editor.getHTML());
  }

  /**
   * Lock the current superdoc
   * @param {Boolean} isLocked 
   * @param {SuperdocUser} lockedBy The user who locked the superdoc
   */
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

  /**
   * Request an immediate save from all collaboration documents
   * @returns {Promise<void>} Resolves when all documents have saved
   */
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
      // this.exportEditorsToDOCX(),
    ];

    console.debug('🦋 [superdoc] Saving superdoc');
    const result = await Promise.all(savePromises);
    console.debug('🦋 [superdoc] Save complete:', result);
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
