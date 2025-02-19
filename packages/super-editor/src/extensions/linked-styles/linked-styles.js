import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@core/Extension.js';

export const LinkedStylesPluginKey = new PluginKey('linkedStyles');

export const LinkedStyles = Extension.create({
  name: 'linkedStyles',

  addPmPlugins() {
    return [createLinkedStylesPlugin(this.editor)];
  }

});

/**
 * The linked styles plugin
 */
const createLinkedStylesPlugin = (editor) => {
  return new Plugin({
    key: LinkedStylesPluginKey,
    state: {
      init(_, { doc, selection }) {
        return {
          styles: editor.storage?.linkedStyles || [],
          decorations: DecorationSet.empty,
        };
      },
      apply(tr, prev, oldEditorState, newEditorState) {
        let decorations = prev.decorations || DecorationSet.empty;
        if (tr.docChanged) {
          decorations = generateDecorations(newEditorState.doc);
          console.debug('decorations', decorations);
        }

        return { ...prev, decorations };
      },
    },
    props: {
      decorations(state) {
        return LinkedStylesPluginKey.getState(state).decorations;
      }
    }
  })
};

const generateDecorations = (doc) => {
  const decorations = [];
  doc.descendants((node, pos) => {
    const { name } = node.type;
    if (name !== 'paragraph') return;
    if (!node.textContent) return;

    const styleId = node.attrs.styleId;
    const marks = node.marks;
    console.debug('marks', marks, styleId);
    
    const style = 'background-color: red; color: blue; font-size: 20px;';
    const decoration = Decoration.inline(pos, pos + node.nodeSize, { style });
    decorations.push(decoration);
  });
  return DecorationSet.create(doc, decorations);
};