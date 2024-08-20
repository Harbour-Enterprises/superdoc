import './style.css';
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/icons/icons.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import * as Y from 'yjs';
import { FirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import { WebsocketProvider } from 'y-websocket'
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useSuperdocStore } from './stores/superdoc-store';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { SuperToolbar } from '@harbour-enterprises/super-editor';
import { SuperInput } from '@harbour-enterprises/super-editor';
import { vClickOutside } from '@harbour-enterprises/common';
import App from './Superdoc.vue'
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';


const createMyApp = () => {
  const app = createApp(App);
  const pinia = createPinia()
  app.use(pinia)
  app.directive('click-outside', vClickOutside);

  const superdocStore = useSuperdocStore();
  return { app, pinia, superdocStore };
}

/* **
  * Superdoc class
  * Expects a config object
*/
let colors = [];
class Superdoc extends EventEmitter {

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

    config.documents = this.#preprocessDocuments(config.documents);
    this.log('Initializing:', config);

    const { app, pinia, superdocStore } = createMyApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = config;
    this.app.config.globalProperties.$documentMode = this.documentMode;

    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;

    // Toolbar
    this.toolbarElement = config.toolbar;
    this.toolbar = null;

    // Active user
    this.user = config.user;
    this.user.color = getRandomColor(config.colors);

    // Modules
    this.modules = this.#initializeModules(config.modules || {});

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
    if (this.toolbarElement) this.addToolbar(this);
  }

  async #initializeModules(modules) {
    this.log('Modules:', modules);
    if ('collaboration' in modules) {
      const module = modules.collaboration;
      const config = modules.collaboration.config;

      const handleAwarenessChange = (update) => {
        const users = getUsers(this.provider, this.colors);
        this.log('Awareness update:', update);
        this.emit('copresence-update', users)
      }
      
      if (module.providerType === 'firestore') {
        const app = initializeApp(config.firebaseConfig);
        this.log('Initializing collaboration with firestore', app);

        this.ydoc = new Y.Doc();
        const basePath = 'superdoc/tests/documents/test'.split('/');
        this.provider = new FirestoreProvider(app, this.ydoc, basePath);

        // console.debug('[superdoc] Provider:', provider);

        // const db = getFirestore(config.firebaseApp);
        // const docRef = doc(db, 'superdoc/test');

        // const docSnap = await getDoc(docRef);
        // if (docSnap.exists()) {
        //   this.log('Document data:', docSnap.data());
        // } else {
        //   this.log('No such document!');
        //   await setDoc(docRef, { message: 'hello world' });
        // }
      } else if (module.providerType === 'socket') {
        this.ydoc = new Y.Doc();
        console.debug('[superdoc] YDoc:', this.ydoc, config.socketUrl, config.documentId);
        this.provider = new WebsocketProvider(config.socketUrl, config.documentID, this.ydoc);
      }

      if (this.provider) {
        this.provider.awareness.setLocalStateField('user', this.user);
        this.provider.awareness.on('update', handleAwarenessChange);
      }

    }
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
    if (this.app) {
      this.log('[superdoc] Unmounting app');
      this.app.unmount();
      delete this.app.config.globalProperties.$config;
      delete this.app.config.globalProperties.$superdoc;
    }
  }
}


export { 
  Superdoc,
  BlankDOCX,

  // Allowed types
  DOCX,
  PDF,
  HTML,

  // Components
  SuperInput
}