import { handleDocPartObj } from './docPartObjImporter';
import { parseProperties } from './importerHelpers.js';

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleAnnotationNode = (nodes, docx, nodeListHandler, insideTrackChange) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:sdt') {
    return { nodes: [], consumed: 0 };
  }

  const node = nodes[0];
  const sdtPr = node.elements.find((el) => el.name === 'w:sdtPr');

  const docPartObj = sdtPr?.elements.find((el) => el.name === 'w:docPartObj');
  if (docPartObj) {
    return handleDocPartObj(nodes, docx, nodeListHandler, insideTrackChange);
  }

  const alias = sdtPr?.elements.find((el) => el.name === 'w:alias');
  const tag = sdtPr?.elements.find((el) => el.name === 'w:tag');
  const fieldType = sdtPr?.elements.find((el) => el.name === 'w:fieldType')?.attributes['w:val'];
  const type = sdtPr?.elements.find((el) => el.name === 'w:fieldTypeShort')?.attributes['w:val'];
  const fieldColor = sdtPr?.elements.find((el) => el.name === 'w:fieldColor')?.attributes['w:val'];
  const isMultipleImage = sdtPr?.elements.find((el) => el.name === 'w:fieldMultipleImage')?.attributes['w:val'];

  const attrs = {
    type,
    fieldId: tag?.attributes['w:val'],
    displayLabel: alias?.attributes['w:val'],
    fieldType,
    fieldColor,
    multipleImage: isMultipleImage === 'true',
  };

  const annotationMarks = [];
  const innerContent = node.elements.find((el) => el.name === 'w:sdtContent');
  const runNode = innerContent?.elements?.find((el) => el.name === 'w:r');
  if (runNode) {
    const { marks: runMarks = [] } = parseProperties(runNode, docx);
    annotationMarks.push(...runMarks);
  }

  const result = {
    type: 'fieldAnnotation',
    attrs,
    marks: annotationMarks,
  };

  return {
    nodes: [result],
    consumed: 1,
  };
};

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const annotationNodeHandlerEntity = {
  handlerName: 'annotationNodeHandler',
  handler: handleAnnotationNode,
};
