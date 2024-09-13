import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@core/Extension.js';
import {TrackInsertMarkName, TrackDeleteMarkName} from "../track-changes/constants";


const CommentsPluginKey = new PluginKey('comments');

export const CommentsPlugin = Extension.create({
  name: 'comments',

  addCommands() {
    return {
      insertComment: (conversation) => ({ tr, dispatch }) => { 
        const { selection } = tr;
        const { $from, $to } = selection;
        
        const { conversationId: threadId } = conversation;  
        const startNode = this.editor.schema.nodes.commentRangeStart.create({ 'w:id': threadId });
        const endNode = this.editor.schema.nodes.commentRangeEnd.create({ 'w:id': threadId });
        tr.insert($from.pos, startNode);
        tr.insert($to.pos + 2, endNode);
        dispatch(tr);
        return true;
      }
    }
  },

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
  const commentIds = new Set();
  const trackedChanges = {};

  if (selection) {
    const { $from, $to } = selection;
    currentSelectionPos.from = $from.pos;
    currentSelectionPos.to = $to.pos;
  }

  doc.descendants((node, pos) => {

    // Check for tracked changes
    const nodeMarks = node.marks;
    const trackedChangeMark = nodeMarks?.find(mark => mark.type.name === TrackInsertMarkName);
    const trackedDeleteMark = nodeMarks?.find(mark => mark.type.name === TrackDeleteMarkName);
    const changeMark = trackedChangeMark || trackedDeleteMark;
    if (nodeMarks && changeMark) {
      const wid = trackedChangeMark?.attrs.wid || trackedDeleteMark?.attrs.wid;
      if (wid) {
        trackedChanges[wid] = {
          start: pos,
          end: node.nodeSize + pos,
        }

        const domPos = view.coordsAtPos(pos);
        if (!allCommentPositions[wid]) allCommentPositions[wid] = {};
        allCommentPositions[wid].threadId = wid;
        allCommentPositions[wid].top = domPos.top;
        allCommentPositions[wid].left = domPos.left;
        allCommentPositions[wid].bottom = domPos.bottom;
        allCommentPositions[wid].right = domPos.right;
        allCommentPositions[wid].type = 'trackedChange';

        if (changeMark.type.name === TrackInsertMarkName) {
          allCommentPositions[wid].insertion = node.textContent;
        } else {
          allCommentPositions[wid].deletion = node.textContent;
        }
      }
    }

    // Check for comments
    if (node.type.name === 'commentRangeStart') {
      const threadId = node.attrs['w:id'];
      commentIds.add(threadId);

      let startPos = pos;
      if (pos > currentSelectionPos.from) { startPos += 1 };

      // Track DOM positions of all comment nodes
      const domBounds = view.coordsAtPos(startPos);
      const domBoundsRight = view.coordsAtPos(startPos + 1);
      allCommentPositions[threadId] = { 
        threadId,
        top: domBounds.top,
        left: domBounds.left,
        right: domBoundsRight.right,
        bottom: domBoundsRight.bottom,
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
      let currentCoords;
      try {
        currentCoords = view.coordsAtPos(pos + 1);
        openNodes.forEach((threadId) => {
          const { top, left, bottom, right } = allCommentPositions[threadId];
  
          allCommentPositions[threadId].top = Math.min(currentCoords.top, top);
          allCommentPositions[threadId].left = Math.min(currentCoords.left, left);
          allCommentPositions[threadId].right = Math.max(currentCoords.right, right);
          allCommentPositions[threadId].bottom = Math.max(currentCoords.bottom, bottom);
        })
      } catch (e) {
        console.debug('[comments] Error getting coords:', e);
      }
    }
  });

  return allCommentPositions
}
