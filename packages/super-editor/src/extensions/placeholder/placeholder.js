import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@core/Extension.js';


export const Placeholder = Extension.create({
  name: 'placeholder',

  addOptions() {
    return {
      placeholder: 'Type something...',
    };
  },

  addPmPlugins() {
    const pluginKey = new PluginKey('placeholder');
    const applyDecoration = (newState) => {
      const { $from } = newState.selection;
      return Decoration.node($from.before(), $from.after(), {
        'data-placeholder': this.options.placeholder,
        class: 'super-editor-placeholder'
      });
    };

    const placeholderPlugin = new Plugin({
      key: pluginKey,
      state: {
        init: (_, state) => {
          return DecorationSet.create(state.doc, [applyDecoration(state)]);
        },
        apply: (tr, oldValue, oldState, newState) => {
          const plainText = newState.doc.textBetween(0, newState.doc.content.size, ' ', ' ');
          if (plainText === '') {
            return DecorationSet.create(newState.doc, [applyDecoration(newState)]);
          }
          return DecorationSet.empty;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });

    return [placeholderPlugin];
  },
});


