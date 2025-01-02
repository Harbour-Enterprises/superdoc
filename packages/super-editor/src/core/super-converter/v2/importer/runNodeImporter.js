import { parseProperties } from './importerHelpers.js';
import { createImportMarks } from './markImporter.js';

/**
 * @type {import("docxImporter").NodeHandler}
 */
const handleRunNode = (nodes, docx, nodeListHandler, insideTrackChange = false, converter, filename) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:r') {
    return { nodes: [], consumed: 0 };
  }

  const node = nodes[0];
  let processedRun = nodeListHandler.handler(node.elements, docx, insideTrackChange, converter, filename)?.filter((n) => n) || [];
  const hasRunProperties = node.elements.some((el) => el.name === 'w:rPr');
  if (hasRunProperties) {
    const { marks = [], attributes = {}, unknownMarks = [] } = parseProperties(node);
    if (node.marks) marks.push(...node.marks);
    processedRun = processedRun.map((n) => ({ ...n, marks: createImportMarks(marks), attributes }));
    converter.unknownMarks = [
      ...converter.unknownMarks,
      ...unknownMarks
    ];
  }
  return { nodes: processedRun, consumed: 1 };
};

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const runNodeHandlerEntity = {
  handlerName: 'runNodeHandler',
  handler: handleRunNode,
};
