
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

const initComments = (editorView, converter) => {
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
      const id = parseInt(node.attrs.attributes['w:id']);
      const coords = editorView.coordsAtPos(pos);
      const parentThread = getParentCommentId(id);
      const comment = getComment(id);

      comments.push({
        id,
        parentThread,
        start: coords,
        comment,
      });
    } else if (node.type.name === 'commentRangeEnd') {
      const id = parseInt(node.attrs.attributes['w:id']);
      const match = comments.find(item => item.id === id);
      const coords = editorView.coordsAtPos(pos);
      match.end = coords;
    }
  });

  console.debug('Loaded comments', comments)
  return comments
}

export {
  initComments
}