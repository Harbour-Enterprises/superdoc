import { parseProperties } from "./importerHelpers.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
const handleTabNode = (nodes, docx, nodeListHandler, insideTrackChange = false) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:tab') {
    return { nodes: [], consumed: 0 };
  }
  const node = nodes[0];
  const { attributes = {} } = node;
  const processedNode = {
    type: 'tab',
    attrs: {
      tabSize: attributes['w:val'] || 36,
    },
    content: [],
  }
  return { nodes: [processedNode], consumed: 1 };
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const tabNodeEntityHandler = {
  handlerName: 'runNodeHandler',
  handler: handleTabNode
};