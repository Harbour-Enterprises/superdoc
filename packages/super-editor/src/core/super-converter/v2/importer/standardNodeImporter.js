import { getElementName, parseProperties } from './importerHelpers.js';

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleStandardNode = (nodes, docx, nodeListHandler, insideTrackChange = false, converter, filename) => {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], consumed: 0 };
  }
  
  const node = nodes[0];
  // Parse properties
  const { name, type } = node;
  const { attributes, elements, marks = [], unknownMarks = [] } = parseProperties(node, docx);
  converter.unknownMarks = [
    ...converter.unknownMarks,
    ...unknownMarks
  ];

  // Iterate through the children and build the schemaNode content
  const content = [];
  if (elements && elements.length) {
    const updatedElements = elements.map((el) => {
      if (!el.marks) el.marks = [];
      el.marks.push(...marks);
      return el;
    });
    content.push(...nodeListHandler.handler(updatedElements, docx, insideTrackChange, converter, filename));
  }

  const resultNode = {
    type: getElementName(node),
    content,
    attrs: { ...attributes },
    marks: [],
  };
  
  if (!resultNode.type) {
    content.unknownTags.push({
      name: node.name,
      attributes: node.attributes,
      elements: node.elements,
    });
  }

  return { nodes: [resultNode], consumed: 1 };
};

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const standardNodeHandlerEntity = {
  handlerName: 'standardNodeHandler',
  handler: handleStandardNode,
};
