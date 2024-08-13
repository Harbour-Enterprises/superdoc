import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@core/Extension.js';


export const DecorationClick = Extension.create({
  name: 'decorationClick',

  addPmPlugins() {
    const editor = this.editor; // available via bound context to the method

    const decorationClickPlugin = new Plugin({
      key: new PluginKey('decorationClick'),
      props: {
        handleClick(view, pos, event) {
          const target = event.target;
          const threadId = target.getAttribute('data-thread-id');
          if (target && threadId) {
            const conversation = editor.getComment(threadId);
            editor.emit('commentClick', { conversation });
          }
          return false;
        },
      },
    });

    return [decorationClickPlugin];
  },
});