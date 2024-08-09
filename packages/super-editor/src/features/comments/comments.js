import { v4 as uuidv4 } from 'uuid';
import { conversation, comment } from '../../../../superdoc/src/components/CommentsLayer/comment-schemas';

console.debug('Comments:', conversation, comment);
const commentsFiles = {};

// Comments
const getParentCommentId = (id) => {
  const data = commentsFiles?.commentsExtended?.elements
  if (!data) return null;
  const elements = data[0].elements
  id = parseInt(id);
  const match = elements[id];
  if (!match) return null;
  if (!('w15:paraIdParent' in match.attributes)) return null;
  
  const parentId = match.attributes['w15:paraIdParent'];
  return elements.findIndex((item) => item.attributes['w15:paraId'] === parentId);
}

const getComment = (id) => {
  const data = commentsFiles?.comments?.elements
  if (!data) return null;
  const elements = data[0].elements;
  const comment = elements[id]
  return comment;
}

const _getCommentTextFromNode = (c) => {
  const elements = c.comment.elements;
  const commentElements = elements[0]?.elements;
  const textElement = commentElements[1]?.elements.find((item) => item.name === 'w:t');
  const text = textElement.elements[0].text;

  return {
    comment: text,
    user: { name: c.comment.attributes['w:author'] },
    timestamp: c.comment.attributes['w:date'],
  }
}

const parseCommentsForSuperdoc = (comments, documentId) => {
  const conversations = [];
  comments.forEach((c) => {
    console.debug('Comment:', c);

    // If this is a child comment, append to the parent conversation
    const parentThread = conversations.find((item) => item.thread === c.parentThread);
    if (parentThread) {
      const comment = _getCommentTextFromNode(c);
      parentThread.comments.push(comment);
      return
    }

    // If it is not a child comment, create a new conversation
    const conversationId = uuidv4();
    const docId = documentId;
    const creatorName = c.comment.attributes['w:author'];

    const selection = {
      documentId: docId,
      page: 1,
      selectionBounds: {
        top: c.start.top,
        left: c.start.left,
        bottom: c.end.bottom,
        right: c.end.right,
      }
    };
  
    const comment = _getCommentTextFromNode(c);
    const convo = {
      thread: c.id,
      conversationId,
      documentId: docId,
      creatorName,
      comments: [comment],
      selection,
    };

    conversations.push(convo);
  })
  return conversations;
}

const initComments = (editorView, converter, documentId) => {
  const comments = [];

  // Get the doc state
  const { doc } = editorView.state;

  // Initialize refs to comments files
  commentsFiles.comments = converter.convertedXml['word/comments.xml'];
  commentsFiles.commentsExtended = converter.convertedXml['word/commentsExtended.xml'];
  commentsFiles.commentsIds = converter.convertedXml['word/commentsIds.xml'];

  // Load comments from the schema
  doc.descendants((node, pos) => {
    if (node.type.name === 'commentRangeStart') {
      console.debug('\n\n COMMENT START NODE:', node, '\n\n');
      if (!('w:id' in node.attrs)) return
      const id = parseInt(node.attrs['w:id']);
      const coords = editorView.coordsAtPos(pos);
      const parentThread = getParentCommentId(id);
      const comment = getComment(id);
      console.debug('Comment:', comment);

      comments.push({
        id,
        parentThread,
        start: coords,
        comment,
      });
    } else if (node.type.name === 'commentRangeEnd') {
      console.debug('\n\n COMMENT START NODE:', node, '\n\n');
      if (!('w:id' in node.attrs)) return
      const id = parseInt(node.attrs['w:id']);
      const match = comments.find(item => item.id === id);
      const coords = editorView.coordsAtPos(pos);
      match.end = coords;
    }
  });

  return parseCommentsForSuperdoc(comments, documentId);
}

export {
  initComments
}