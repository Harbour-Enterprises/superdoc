import { getElementName, parseProperties, isPropertiesElement } from './importerHelpers.js';

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleStandardNode = (params) => {
  const { nodes, docx, nodeListHandler } = params;
  if (!nodes || nodes.length === 0) {
    return { nodes: [], consumed: 0 };
  }

  // Parse properties
  const node = nodes[0];
  const { name } = node;
  const { attributes, elements, marks = [] } = parseProperties(node, docx);
  
  // Formatting only nodes
  if (isPropertiesElement(node)) {
    return {
      nodes: [{
        type: getElementName(node),
        attrs: { ...attributes },
        marks: [],
      }],
      consumed: 0
    };
  }
  
  // Unhandled nodes
  if (!getElementName(node)) {
    return { 
      nodes: [{
        type: name,
        content: elements,
        attrs: { ...attributes },
        marks,
      }], 
      consumed: 0,
      unhandled: true,
    };
  }

  // Iterate through the children and build the schemaNode content
  // Skip run properties since they are formatting only elements
  const content = [];
  if (elements && elements.length) {
    const updatedElements = elements.map((el) => {
      if (!el.marks) el.marks = [];
      el.marks.push(...marks);
      return el;
    });

    const childParams = { ...params, nodes: updatedElements };
    const childContent = nodeListHandler.handler(childParams);
    content.push(...childContent);
  }
  
  const resultNode = {
    type: getElementName(node),
    content,
    attrs: { ...attributes },
    marks: [],
  };
  
  return { nodes: [resultNode], consumed: 1 };
};

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const standardNodeHandlerEntity = {
  handlerName: 'standardNodeHandler',
  handler: handleStandardNode,
};
