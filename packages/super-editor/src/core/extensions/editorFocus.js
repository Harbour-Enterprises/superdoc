import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '../Extension.js';

export const EditorFocus = Extension.create({
  name: 'editorFocus',

  addPmPlugins() {
    const editor = this.editor;

    const editorFocusPlugin = new Plugin({
      key: new PluginKey('editorFocus'),
      props: {
        handleDOMEvents: {
          focus: (view, event) => {
            editor.isFocused = true;

            const tr = editor.state.tr
              .setMeta('focus', { event })
              // https://prosemirror.net/docs/ref/#history.history
              .setMeta('addToHistory', false);

            view.dispatch(tr);
            return false;
          },
          blur: (view, event) => {
            editor.isFocused = false;

            const tr = editor.state.tr
              .setMeta('blur', { event })
              .setMeta('addToHistory', false);

            view.dispatch(tr);
            return false;
          },
        },
      },
    });

    return [editorFocusPlugin];
  },
});
