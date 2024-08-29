import { Extension } from '@core/index.js';
import {
  ySyncPlugin,
} from 'y-prosemirror'
import * as Y from 'yjs'

export const Collaboration = Extension.create({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      ydoc: null,
      field: 'default',
      fragment: null,
      provider: null,
    }
  },

  addPmPlugins() {
    const ySyncPluginOptions = {
      ...this.options.ySyncOptions,
      onFirstRender: this.options.onFirstRender,
    }

    console.debug('\n\n DO WE HAVE YDOC?', this.options.ydoc)
    if (!this.options.provider) {
      this.options.ydoc = new Y.Doc()
    } else {
      console.debug('[collaboration] Using existing Y.Doc instance', this.options.ydoc)
    }

    const documentId = this.editor.options.documentId;
    const fragment = this.options.ydoc.getXmlFragment(documentId);
    const ySyncPluginInstance = ySyncPlugin(fragment, ySyncPluginOptions)
    return [ySyncPluginInstance]
  },

});
