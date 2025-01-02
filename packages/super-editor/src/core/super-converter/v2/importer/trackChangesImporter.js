import { TrackDeleteMarkName, TrackInsertMarkName } from '@extensions/track-changes/constants.js';
import { parseProperties } from './importerHelpers.js';

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleTrackChangeNode = (nodes, docx, nodeListHandler, insideTrackChange = false, converter) => {
  if (nodes.length === 0 || !(nodes[0].name === 'w:del' || nodes[0].name === 'w:ins')) {
    return { nodes: [], consumed: 0 };
  }
  const node = nodes[0];
  const { name } = node;
  const { attributes, elements, unknownMarks = [] } = parseProperties(node);
  converter.unknownMarks = [
    ...converter.unknownMarks,
    ...unknownMarks
  ];

  const subs = nodeListHandler.handler(elements, docx, true, converter);
  const changeType = name === 'w:del' ? TrackDeleteMarkName : TrackInsertMarkName;

  const mappedAttributes = {
    id: attributes['w:id'],
    date: attributes['w:date'],
    author: attributes['w:author'],
    authorEmail: attributes['w:authorEmail'],
  };

  subs.forEach((subElement) => {
    if (subElement.marks === undefined) subElement.marks = [];
    subElement.marks.push({ type: changeType, attrs: mappedAttributes });
  });

  return { nodes: subs, consumed: 1 };
};

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const trackChangeNodeHandlerEntity = {
  handlerName: 'trackChangeNodeHandler',
  handler: handleTrackChangeNode,
};
