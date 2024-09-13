import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@core/Extension.js';


const CommentsPluginKey = new PluginKey('comments');

export const CommentsPlugin = Extension.create({
  name: 'comments',

  addPmPlugins() {
    const editor = this.editor;
    const commentsPlugin = new Plugin({
      key: CommentsPluginKey,
      state: {
        init(_, { doc, selection }) {
          return {
            commentPositions: highlightComments(editor, doc, selection),
            activeThreadId: null,
          }
        },
        apply(tr, _, __, newEditorState) {
          const { selection } = tr;
          const doc = newEditorState.doc;
          
          let commentPositions = [];
          let activeThreadId = null;

          if (tr.docChanged) {
            commentPositions = highlightComments(editor, doc, selection);
            activeThreadId = getActiveCommentId(editor, doc, selection);
          }

          // If the selection changes, check if we're inside a comment
          if (tr.selectionSet) {
            activeThreadId = getActiveCommentId(editor, doc, selection);
          }
        
          return {
            commentPositions,
            activeThreadId,
          }
        },
      }
    });
    return [commentsPlugin];
  }
});

const getActiveCommentId = (editor, doc, selection) => {
  if (!selection) return;

  const { $from, $to } = selection;
  
  // We only need to check for active comment ID if the selection is empty
  if ($from.pos !== $to.pos) return;

  const overlappingThreadIds = new Set();
  doc.descendants((node, pos) => {
    if (node.type.name === 'commentRangeStart') {
      // Track nodes that overlap with the selection
      if ($from.pos >= pos) {
        overlappingThreadIds.add(node.attrs['w:id']);
      }
    };

    if (node.type.name === 'commentRangeEnd') {
      const threadId = node.attrs['w:id'];
      const endPos = pos;
      if ($from.pos > endPos) {
        overlappingThreadIds.delete(threadId);
      }
    };

    // If we pass the selection, return the ID if any
    if (pos > $from.pos) {
      return overlappingThreadIds;
    }

  });
  return overlappingThreadIds.size > 0 ? overlappingThreadIds.values().next().value : null;
}

const highlightComments = (editor, doc, selection) => {
  const { view } = editor;
  let currentSelectionPos = {};
  const allCommentPositions = {};
  const openNodes = new Set();

  if (selection) {
    const { $from, $to } = selection;
    currentSelectionPos.from = $from.pos;
    currentSelectionPos.to = $to.pos;
  }

  doc.descendants((node, pos) => {
    if (node.type.name === 'commentRangeStart') {
      const threadId = node.attrs['w:id'];

      let startPos = pos;
      if (pos > currentSelectionPos.from) { startPos += 1 };

      // Track DOM positions of all comment nodes
      const domBounds = view.coordsAtPos(startPos);
      allCommentPositions[threadId] = { 
        threadId,
        top: domBounds.top,
        left: domBounds.left,
        right: domBounds.right,
        bottom: domBounds.bottom,
      };
      openNodes.add(threadId);
    }

    else if (node.type.name === 'commentRangeEnd') {
      const threadId = node.attrs['w:id'];

      // Track end positions for the node
      const existingTop = allCommentPositions[threadId].top;
      const existingLeft = allCommentPositions[threadId].left;
      const existingRight = allCommentPositions[threadId].right;
      const existingBottom = allCommentPositions[threadId].bottom;
      const endNodeCoords = view.coordsAtPos(pos + 1);
      allCommentPositions[threadId].top = Math.min(endNodeCoords.top, existingTop);
      allCommentPositions[threadId].left = Math.min(endNodeCoords.left, existingLeft);
      allCommentPositions[threadId].right = Math.max(endNodeCoords.right, existingRight);
      allCommentPositions[threadId].bottom = Math.max(endNodeCoords.bottom, existingBottom);
      openNodes.delete(threadId);
    }

    else {
      const currentCoords = view.coordsAtPos(pos + 1);
      openNodes.forEach((threadId) => {
        const { top, left, bottom, right } = allCommentPositions[threadId];

        allCommentPositions[threadId].top = Math.min(currentCoords.top, top);
        allCommentPositions[threadId].left = Math.min(currentCoords.left, left);
        allCommentPositions[threadId].right = Math.max(currentCoords.right, right);
        allCommentPositions[threadId].bottom = Math.max(currentCoords.bottom, bottom);
      })
    }
  });


  return allCommentPositions;
}
