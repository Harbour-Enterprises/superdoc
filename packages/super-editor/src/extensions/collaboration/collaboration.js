import { Extension } from '@core/index.js';
import {
  redo,
  undo,
  ySyncPlugin,
  yUndoPlugin,
  yUndoPluginKey,
} from 'y-prosemirror'

export const Collaboration = Extension.create({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      document: null,
      field: 'default',
      fragment: null,
    }
  },

  addPmPlugins() {

    const fragment = this.options.fragment
      ? this.options.fragment
      : this.options.document.getXmlFragment(this.options.field)

    const ySyncPluginOptions = {
      ...this.options.ySyncOptions,
      onFirstRender: this.options.onFirstRender,
    }

    const ySyncPluginInstance = ySyncPlugin(fragment, ySyncPluginOptions)
    return [ySyncPluginInstance]
  },
});
