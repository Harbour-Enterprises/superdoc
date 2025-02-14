// TODO: side-effect with styles
import '../style.css';
import '@harbour-enterprises/super-editor/style.css';

import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider';

import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperToolbar } from '@harbour-enterprises/super-editor';
import { SuperComments } from '../components/CommentsLayer/commentsList/super-comments-list.js';
import { createSuperdocVueApp } from './create-app';
import { shuffleArray } from '@harbour-enterprises/common/collaboration/awareness.js';
import { Telemetry } from '@harbour-enterprises/common/Telemetry.js';
import { createDownload, cleanName } from './helpers/export.js';
import {
  initSuperdocYdoc,
  initCollaborationComments,
  makeDocumentsCollaborative,
} from './collaboration/helpers.js';

/**
 * @typedef {Object} SuperdocUser The current user of this superdoc
 * @property {string} name The user's name
 * @property {string} email The user's email
 * @property {string | null} image The user's photo
 */

/* **
 * SuperDoc class
 * Expects a config object
 */
export class SuperDoc extends EventEmitter {
  static allowedTypes = [DOCX, PDF, HTML];

  config;

  version;

  documentMode;

  version;

  config = {
    superdocId: null,
    selector: '#superdoc', // The selector to mount the superdoc into
    documentMode: 'editing',
    role: 'editor', // The role of the user in this superdoc: editor, viewer, suggester
    documents: [], // The documents to load

    colors: [], // Optional: Colors to use for user awareness
    user: { name: null, email: null }, // The current user of this superdoc
    users: [], // Optional: All users of this superdoc (can be used for @-mentions)

    modules: {}, // Optional: Modules to load
    title: 'SuperDoc',
    conversations: [],
    pagination: false, // Optional: Whether to show pagination in SuperEditors
    isCollaborative: false,

    // toolbar config
    toolbar: null, // Optional DOM element to render the toolbar in
    toolbarGroups: ['left', 'center', 'right'],
    toolbarIcons: {},

    isDev: false,

    // telemetry config
    telemetry: null,

    // Events
    onEditorBeforeCreate: () => null,
    onEditorCreate: () => null,
    onEditorDestroy: () => null,
    onContentError: () => null,
    onReady: () => null,
    onCommentsUpdate: () => null,
    onAwarenessUpdate: () => null,
    onLocked: () => null,
    onPdfDocumentReady: () => null,
    onSidebarToggle: () => null,
    onCollaborationReady: () => null,
    onException: () => null,

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
      ...config,
    };

    this.config.colors = shuffleArray(this.config.colors);
    this.userColorMap = new Map();
    this.colorIndex = 0;
    this.version = __APP_VERSION__;
    console.debug('🦋 [superdoc] Using SuperDoc version:', this.version);
    this.superdocId = config.superdocId || uuidv4();
    this.colors = this.config.colors;

    // Initialize collaboration if configured
    await this.#initCollaboration(this.config.modules);
    
    this.#initTelemetry();

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
    this.comments = [];

    this.app.mount(this.config.selector);

    // Required editors
    this.readyEditors = 0;

    this.isLocked = this.config.isLocked || false;
    this.lockedBy = this.config.lockedBy || null;

    // If a toolbar element is provided, render a toolbar
    this.addToolbar(this);
  
    // If comments module contains a selector, we can render comments list
    this.addCommentsList(this);
  }

  get requiredNumberOfEditors() {
    return this.superdocStore.documents.filter((d) => d.type === DOCX).length;
  }

  get state() {
    return {
      documents: this.superdocStore.documents,
      users: this.users,
    };
  }

  #initVueApp() {
    const { app, pinia, superdocStore, commentsStore } = createSuperdocVueApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = this.config;
    this.app.config.globalProperties.$documentMode = this.config.documentMode;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;
    this.commentsStore = commentsStore;
    this.version = this.config.version;
    this.superdocStore.init(this.config);
    this.commentsStore.init(this.config.modules.comments);
  }

  #initListeners() {
    this.on('editorBeforeCreate', this.config.onEditorBeforeCreate);
    this.on('editorCreate', this.config.onEditorCreate);
    this.on('editorDestroy', this.config.onEditorDestroy);
    this.on('ready', this.config.onReady);
    this.on('comments-update', this.config.onCommentsUpdate);
    this.on('awareness-update', this.config.onAwarenessUpdate);
    this.on('locked', this.config.onLocked);
    this.on('pdf-document-ready', this.config.onPdfDocumentReady);
    this.on('sidebar-toggle', this.config.onSidebarToggle);
    this.on('collaboration-ready', this.config.onCollaborationReady);
    this.on('content-error', this.onContentError);
    this.on('exception', this.config.onException);
  }

  /**
   * Initialize collaboration if configured
   * @param {Object} config
   * @returns {Promise<Array>} The processed documents with collaboration enabled
   */
  async #initCollaboration({ collaboration: collaborationModuleConfig } = {}) {
    if (!collaborationModuleConfig) return this.config.documents;

    // Flag this superdoc as collaborative
    this.isCollaborative = true;

    // Start a socket for all documents and general metaMap for this SuperDoc
    this.socket = new HocuspocusProviderWebsocket({
      url: collaborationModuleConfig.url,
    });

    // Initialize global superdoc sync - for comments, view, etc.
    initSuperdocYdoc(this);

    // Initialize comments sync, if enabled
    initCollaborationComments(this);

    // Initialize collaboration for documents
    return makeDocumentsCollaborative(this);
  };

  /**
   * Initialize telemetry service.
   */
  #initTelemetry() {
    this.telemetry = new Telemetry({
      enabled: this.config.telemetry?.enabled ?? true,
      licenceKey: this.config.telemetry?.licenceKey,
      endpoint: this.config.telemetry?.endpoint,
      superdocId: this.superdocId,
    });
  }

  onContentError({ error, editor }) {
    const { documentId } = editor.options;
    const doc = this.superdocStore.documents.find((d) => d.id === documentId);
    this.config.onContentError({ error, editor, documentId: doc.id, file: doc.data });
  }

  broadcastPdfDocumentReady() {
    this.emit('pdf-document-ready');
  }

  broadcastReady() {
    if (this.readyEditors === this.requiredNumberOfEditors) {
      this.emit('ready', { superdoc: this });
    }
  }

  broadcastEditorBeforeCreate(editor) {
    this.emit('editorBeforeCreate', { editor });
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

  broadcastSidebarToggle(isOpened) {
    this.emit('sidebar-toggle', isOpened); 
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
      isDev: this.isDev || false,
      toolbarGroups: this.config.toolbarGroups,
      role: this.config.role,
      pagination: this.config.pagination,
      icons: this.config.toolbarIcons,
    };

    this.toolbar = new SuperToolbar(config);
    this.toolbar.on('superdoc-command', this.onToolbarCommand.bind(this));
  }

  addCommentsList() {
    const selector = this.config.modules?.comments?.selector;
    console.debug('🦋 [superdoc] Adding comments list to:', selector);
    if (!selector) return;

    this.commentsList = new SuperComments(this.config.modules?.comments, this);
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
    };

    if (types[type]) types[type]();
  }

  #setModeEditing() {
    if (this.config.role !== 'editor') return this.#setModeSuggesting();
    if (this.superdocStore.documents.length > 0) {
      const firstEditor = this.superdocStore.documents[0]?.getEditor();
      if (firstEditor) {
        this.setActiveEditor(firstEditor);
        this.toolbar.activeEditor = firstEditor;
      }
    }

    this.superdocStore.documents.forEach((doc) => {
      doc.restoreComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('editing');
    });
  }

  #setModeSuggesting() {
    if (!['editor', 'suggester'].includes(this.config.role)) return this.#setModeViewing();
    this.superdocStore.documents.forEach((doc) => {
      doc.restoreComments();
      const editor = doc.getEditor();
      if (editor) editor.setDocumentMode('suggesting');
    });
  }

  #setModeViewing() {
    this.toolbar.activeEditor = null;
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
    const editors = [];
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

  async export(exportType = ['docx']) {
    // Get the docx files first
    const baseFileName = cleanName(this.config.title);
    const docxFiles = await this.exportEditorsToDOCX();
    const blobsToZip = [];
    const filenames = [];

    // If we are exporting docx files, add them to the zip
    if (exportType.includes('docx')) {
      docxFiles.forEach((blob, index) => {
        blobsToZip.push(blob);
        filenames.push(`${baseFileName}.docx`);
      });
    }

    // If we only have one blob, just download it. Otherwise, zip them up.
    if (blobsToZip.length === 1) {
      createDownload(blobsToZip[0], baseFileName, exportType[0]);
    } else {
      const zip = await createZip(blobsToZip, filenames);
      createDownload(zip, baseFileName, 'zip');
    }
  };

  async exportEditorsToDOCX() {
    const comments = this.commentsStore?.prepareCommentsForExport();
    const docxPromises = [];
    this.superdocStore.documents.forEach((doc) => {
      const editor = doc.getEditor();
      if (editor) {
        docxPromises.push(editor.exportDocx({ comments }));
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
        }
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
  }

  destroy() {
    if (!this.app) return;
    this.log('[superdoc] Unmounting app');

    this.config.documents.forEach((doc) => {
      doc.ydoc.destroy();
      doc.provider.destroy();
    });

    this.superdocStore.reset();
    
    // Clean up telemetry when editor is destroyed
    this.telemetry?.destroy();

    this.app.unmount();
    this.removeAllListeners();
    delete this.app.config.globalProperties.$config;
    delete this.app.config.globalProperties.$superdoc;
  }
}
