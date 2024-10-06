/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleLineBreakNode = (nodes, docx, nodeListHandler, insideTrackChange) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:br') {
    return { nodes: [], consumed: 0 };
  }

  const attrs = {};

  const lineBreakType = nodes[0].attributes?.['w:type'];
  if (lineBreakType) attrs['lineBreakType'] = lineBreakType;


  return {
    nodes: [{
      type: 'lineBreak',
      content: [],
      attrs,
    }], consumed: 1
  };
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const lineBreakNodeHandlerEntity = {
  handlerName: 'lineBreakNodeHandler',
  handler: handleLineBreakNode
}