import { Extension } from '@core/index.js';
import {
  ySyncPlugin,
} from 'y-prosemirror'
import * as Y from 'yjs';

export const Collaboration = Extension.create({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      ydoc: null,
      field: 'default',
      fragment: null,
    }
  },

  addPmPlugins() {
    if (!this.editor.options.ydoc) return [];
    this.options.ydoc = this.editor.options.ydoc;

    const ySyncPluginOptions = {
      ...this.options.ySyncOptions,
    }

    const documentId = this.editor.options.documentId;
    const fragment = this.options.ydoc.getXmlFragment(documentId);
    const ySyncPluginInstance = ySyncPlugin(fragment, ySyncPluginOptions)
    return [ySyncPluginInstance]
  },

});
