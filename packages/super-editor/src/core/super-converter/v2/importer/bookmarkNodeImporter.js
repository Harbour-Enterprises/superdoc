/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleBookmarkNode = (nodes, docx, nodeListHandler, insideTrackChange) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:bookmarkStart') {
    return { nodes: [], consumed: 0 };
  }
  const node = nodes[0];

  const handleStandardNode = nodeListHandler.handlerEntities.find(e => e.handlerName === 'standardNodeHandler')?.handler;
  if (!handleStandardNode) {
    console.error('Standard node handler not found');
    return { nodes: [], consumed: 0 };
  }
  const result = handleStandardNode([node], docx, nodeListHandler, insideTrackChange);
  if (result.nodes.length === 1) {
    result.nodes[0].attrs.name = node.attributes['w:name'];
  }
  return result;
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const bookmarkNodeHandlerEntity = {
  handlerName: 'bookmarkNodeHandler',
  handler: handleBookmarkNode
};