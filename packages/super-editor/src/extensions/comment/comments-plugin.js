import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@core/Extension.js';
import { TrackInsertMarkName, TrackDeleteMarkName } from '../track-changes/constants.js';
import { Decoration, DecorationSet } from "prosemirror-view";

const CommentsPluginKey = new PluginKey('comments');

export const CommentsPlugin = Extension.create({
  name: 'comments',

  addCommands() {
    return {
      insertComment:
        (conversation) =>
        ({ tr, dispatch }) => {
          const { selection } = tr;
          const { $from, $to } = selection;

          const { commentId: threadId } = conversation;
          const commentStartNodeAttrs = {
            'w:id': threadId,
            internal: true,
          };
          const startNode = this.editor.schema.nodes.commentRangeStart.create(commentStartNodeAttrs);
          const endNode = this.editor.schema.nodes.commentRangeEnd.create({ 'w:id': threadId });
          tr.insert($from.pos, startNode);
          tr.insert($to.pos + 2, endNode);
          dispatch(tr);
          return true;
        },
    };
  },

  addPmPlugins() {
    const editor = this.editor;
    const commentsPlugin = new Plugin({
      key: CommentsPluginKey,
      state: {
        init(_, { doc, selection }) {
          const { commentPositions, decorations:initialDecs } = processDocumentComments(editor, doc) || {};
          const decorations = initialDecs.length ? DecorationSet.create(doc, initialDecs) : DecorationSet.empty;

          return {
            commentPositions,
            decorations,
            activeThreadId: null,
          };
        },
        apply(tr, _, __, newEditorState) {
          const { selection } = tr;
          const doc = newEditorState.doc;

          let activeThreadId = null;

          // If the selection changes, check if we're inside a comment
          // if (!tr.docChanged && tr.selectionSet) {
          //   activeThreadId = getActiveCommentId(doc, selection);
          // }

          // if (Object.keys(commentPositions)?.length || activeThreadId) {
          //   tr.setMeta('commentsPluginState', { commentPositions, activeThreadId });
          //   editor.emit('commentsUpdate', { editor, transaction: tr });
          // }

          // tr.mapping.maps.forEach((stepMap, i) => {
          //   stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
          //     let node = newEditorState.doc.nodeAt(newStart);
          //     if (node && node.type.name === "commentRangeEnd") {
          //       const params = {
          //         type: 'new',
          //         id: node.attrs['w:id'],
          //       };
          //     }
          //   });
          // });
          
          const { commentPositions, decorations } = processDocumentComments(editor, doc) || {};
          return {
            commentPositions,
            activeThreadId,
            decorations: DecorationSet.create(doc, decorations),
          };
        },
      },
      props: {
        decorations(state) {
          return this.getState(state).decorations;
        }
      }
    });
    return [commentsPlugin];
  },
});

/**
 * Check if this node is a tracked changes node
 * @param {Node} node The node to check
 * @returns {Node | null} Either a tracked change node (insert, delete) or null
 */
const getTrackedChangeNode = (node) => {
  const nodeMarks = node.marks;
  const trackedChangeMark = nodeMarks?.find((mark) => mark.type.name === TrackInsertMarkName);
  const trackedDeleteMark = nodeMarks?.find((mark) => mark.type.name === TrackDeleteMarkName);
  return trackedChangeMark || trackedDeleteMark;
};

/**
 * Process tracking for tracked changes nodes
 * @param {EditorView} view The current editor view
 * @param {Object} allCommentPositions The current positions of nodes being tracked
 * @param {Node} node The current node to consider
 * @param {Number} pos The position of the node
 * @returns {void} allCommentPositions is modified in place
 */
const trackTrackedChangeNodes = (view, allCommentPositions, node, pos) => {
  // Check for tracked changes

  const changeMark = getTrackedChangeNode(node);
  if (changeMark) {
    const wid = changeMark.attrs.wid;
    if (wid) {
      try {
        const domPos = view.coordsAtPos(pos);
        if (!allCommentPositions[wid]) allCommentPositions[wid] = {};
        allCommentPositions[wid].threadId = wid;
        allCommentPositions[wid].top = domPos.top;
        allCommentPositions[wid].left = domPos.left;
        allCommentPositions[wid].bottom = domPos.bottom;
        allCommentPositions[wid].right = domPos.right;
        allCommentPositions[wid].type = 'trackedChange';
        allCommentPositions[wid].wid = wid;
        allCommentPositions[wid].start = pos;
        allCommentPositions[wid].end = node.nodeSize + pos;

        if (changeMark.type.name === TrackInsertMarkName) {
          allCommentPositions[wid].insertion = node.textContent;
        }

        if (changeMark.type.name === TrackDeleteMarkName) {
          allCommentPositions[wid].deletion = node.textContent;
        }
      } catch (e) {}
    }
  }
};

/**
 * Update tracked positions of comment or track changes nodes
 * @param {String} threadId The ID of the comment thread
 * @param {EditorView} view Current editor view
 * @param {Number} pos The position of the node to consider
 * @returns {Object} The updated positions of the node
 */
const updatePositions = (view, pos, currentPos) => {
  const coords = view.coordsAtPos(pos);
  const existingTop = currentPos.top || 0;
  const existingLeft = currentPos.left || 0;
  const existingRight = currentPos.right || 0;
  const existingBottom = currentPos.bottom || 0;

  return {
    top: Math.min(coords.top, existingTop),
    left: Math.min(coords.left, existingLeft),
    right: Math.max(coords.right, existingRight),
    bottom: Math.max(coords.bottom, existingBottom),
  };
};

/**
 * Main function to track comment and tracked change nodes
 *
 * @param {EditorView} view The current editor view
 * @param {Object} allCommentPositions The current positions of nodes being tracked
 * @param {Node} node The current node to consider
 * @param {Number} pos The position of the node
 * @returns {void} allCommentPositions is modified in place
 */
const trackCommentNodes = ({ allCommentPositions, decorations, node, pos, editor }) => {
  const commentIds = new Set();
  const threadId = node.attrs['w:id'];

  if (threadId && node.type.name === 'commentRangeStart') {
    commentIds.add(threadId);

    allCommentPositions[threadId] = {
      threadId,
      start: pos,
      end: null,
      internal: node.attrs.internal,
    };
    console.debug('---START', allCommentPositions, threadId)
  } else if (node.type.name === 'commentRangeEnd') {
    const currentItem = allCommentPositions[threadId];
    console.debug('---THREAD', threadId, currentItem, allCommentPositions);
    if (!currentItem) return;
    currentItem.end = pos + node.nodeSize;

    const deco = Decoration.inline(
      currentItem.start,
      currentItem.end + 1,
      { style: "background-color: #D2E5E6;" }
    );
    decorations.push(deco);
  };
};

const getCommentData = (editor) => {
  const converter = editor.converter;
  if (!converter) return;

  const docx = converter.convertedXml;
  const comments = docx['word/comments.xml'];
  
  return comments;
};


/**
 * Iterate through the document to track comment and tracked changes nodes
 * @param {*} editor The current editor instance
 * @param {*} doc The current document
 * @returns {Object} The positions of all tracked nodes where keys are the thread IDs
 */
const processDocumentComments = (editor, doc) => {
  const { view } = editor;
  const allCommentPositions = {};
  const decorations = [];

  // Both of the funcitons below alter coordinates in allCommentPositions
  doc.descendants((node, pos) => {
    // Try to track comment nodes
    trackCommentNodes({
      allCommentPositions, decorations, node, pos, editor,
    });

    // Try to track any tracked changes nodes
    // trackTrackedChangeNodes(view, allCommentPositions, node, pos);

  });

  return {
    commentPositions: allCommentPositions,
    decorations,
  };
};

/**
 * This is run when a new selection is set (tr.selectionSet) to return the active comment ID, if any
 * If there are multiple, only return the first one
 *
 * @param {Object} doc The current document
 * @param {Selection} selection The current selection
 * @returns {String | null} The active comment ID, if any
 */
const getActiveCommentId = (doc, selection) => {
  if (!selection) return;
  const { $from, $to } = selection;

  // We only need to check for active comment ID if the selection is empty
  if ($from.pos !== $to.pos) return;

  const nodeAtPos = doc.nodeAt($from.pos);
  if (!nodeAtPos) return;

  // If we have a tracked change, we can return it right away
  const trackedChangeNode = getTrackedChangeNode(nodeAtPos);
  if (trackedChangeNode) {
    return trackedChangeNode.attrs.wid;
  }

  // Otherwise, we need to check for comment nodes
  const overlappingThreadIds = new Set();
  let found = false;
  doc.descendants((node, pos) => {
    if (found) return;

    if (node.type.name === 'commentRangeStart') {
      // Track nodes that overlap with the selection
      if ($from.pos >= pos) {
        overlappingThreadIds.add(node.attrs['w:id']);
      }
    }

    if (node.type.name === 'commentRangeEnd') {
      const threadId = node.attrs['w:id'];
      const endPos = pos;
      if ($from.pos > endPos) overlappingThreadIds.delete(threadId);
    }

    // If we pass the selection, return the ID if any
    if (pos > $from.pos) {
      found = true;
    }
  });
  return overlappingThreadIds.size > 0 ? overlappingThreadIds.values().next().value : null;
};
