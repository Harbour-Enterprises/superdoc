import './style.css';
import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useSuperdocStore } from './stores/superdoc-store';
import clickOutside from '@/helpers/v-click-outside';
import App from './Superdoc.vue'

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
export default class Superdoc extends EventEmitter {
  constructor(config) {
    super();
    const { app, pinia, superdocStore } = createMyApp(this);
    this.app = app;
    this.pinia = pinia;
    this.app.config.globalProperties.$config = config;
    this.app.config.globalProperties.$superdoc = this;
    this.superdocStore = superdocStore;

    this.superdocStore.init(config);
    this.activeEditor = null;

    // Directives
    this.app.mount(config.selector);
  }

  broadcastComments(type, data) {
    console.debug('[comments] Broadcasting:', type, data);
    this.emit('comments-update', type, data);
  }

  onSelectionUpdate({ editor, transaction }) {
    this.activeEditor = editor;
    this.emit('selection-update', { editor, transaction });
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
    if (this.app) {
      this.app.unmount();
    }

    // Remove global properties
    delete this.app.config.globalProperties.$config;
    delete this.app.config.globalProperties.$superdoc;
  }
}
