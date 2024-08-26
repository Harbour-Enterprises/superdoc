import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@core/Extension.js';


export const CommentsPlugin = Extension.create({
  name: 'comments',

  addPmPlugins() {
    const commentsPlugin = new Plugin({
      key: new PluginKey('comments'),
      state: {
        init(_, { doc }) {
          return highlightComments(doc);
        },
        apply(tr, oldState, oldEditorState, newEditorState) {
          let decorationSet = oldState.map(tr.mapping, tr.doc);
          const { selection } = tr;
          const doc = tr.doc;
          if (tr.docChanged || tr.selectionSet) decorationSet = highlightComments(doc, selection);
          return decorationSet;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });
    return [commentsPlugin];
  }
});

const highlightComments = (doc, selection) => {
  const decorations = [];
  let startPos = null;

  doc.descendants((node, pos) => {
    if (node.type.name === 'commentRangeStart') {
      startPos = pos;
    };

    if (node.type.name === 'commentRangeEnd' && startPos !== null) {
      const threadId = node.attrs['w:id'];
      let highlightClass = 'sd-highlight';
      if (selection && isSelectionOverlapping(selection, startPos, pos + 1)) {
        highlightClass = 'sd-highlight sd-highlight-active';
      }

      decorations.push(
        Decoration.inline(startPos, pos + 1, { class: highlightClass, 'data-thread-id': threadId })
      );
      startPos = null;
    };
  });

  return DecorationSet.create(doc, decorations);
}

function isSelectionOverlapping(selection, start, end) {
  const { from, to } = selection;
  return (from <= end && to >= start);
}