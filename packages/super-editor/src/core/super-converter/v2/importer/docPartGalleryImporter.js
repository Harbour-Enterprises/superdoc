/**
 * Handler for docPartObject: docPartGallery node type of 'Table of contents'
 * @param {*} node
 * @param {*} docx
 * @param {*} nodeListHandler
 * @param {*} insideTrackChange
 * @param {*} converter
 * @returns {Array} The processed nodes
 */
export const tableOfContentsHandler = (node, docx, nodeListHandler, insideTrackChange = false, converter) => {
  return nodeListHandler.handler(node.elements, docx, false, converter);
};
