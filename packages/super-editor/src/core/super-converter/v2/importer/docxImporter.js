import { getInitialJSON } from '../docxHelper.js';
import { carbonCopy } from '../../../utilities/carbonCopy.js';
import { twipsToInches } from '../../helpers.js';
import { tableNodeHandlerEntity } from './tableImporter.js';
import { drawingNodeHandlerEntity } from './imageImporter.js';
import { trackChangeNodeHandlerEntity } from './trackChangesImporter.js';
import { hyperlinkNodeHandlerEntity } from './hyperlinkImporter.js';
import { runNodeHandlerEntity } from './runNodeImporter.js';
import { textNodeHandlerEntity } from './textNodeImporter.js';
import { paragraphNodeHandlerEntity } from './paragraphNodeImporter.js';
import { annotationNodeHandlerEntity } from './annotationImporter.js';
import { standardNodeHandlerEntity } from './standardNodeImporter.js';
import { lineBreakNodeHandlerEntity } from './lineBreakImporter.js';
import { bookmarkNodeHandlerEntity } from './bookmarkNodeImporter.js';
import { tabNodeEntityHandler } from './tabImporter.js';
import { listHandlerEntity } from './listImporter.js';

/**
 * @typedef {import()} XmlNode
 * @typedef {{type: string, content: *, attrs: {}}} PmNodeJson
 * @typedef {{type: string, attrs: {}}} PmMarkJson
 *
 * @typedef {(nodes: XmlNode[], docx: ParsedDocx, insideTrackCahange: boolean) => PmNodeJson[]} NodeListHandlerFn
 * @typedef {{handler: NodeListHandlerFn, handlerEntities: NodeHandlerEntry[]}} NodeListHandler
 *
 * @typedef {(nodes: XmlNode[], docx: ParsedDocx, nodeListHandler: NodeListHandler, insideTrackCahange: boolean) => {nodes: PmNodeJson[], consumed: number}} NodeHandler
 * @typedef {{handlerName: string, handler: NodeHandler}} NodeHandlerEntry
 */

/**
 *
 * @param {ParsedDocx} docx
 * @param {SuperConverter} converter instance.
 * @param {Editor} editor instance.
 * @returns {{pmDoc: PmNodeJson, savedTagsToRestore: XmlNode, pageStyles: *}|null}
 */
export const createDocumentJson = (docx, converter, editor) => {
  const json = carbonCopy(getInitialJSON(docx));
  if (!json) return null;

  // Track initial document structure
  if (converter?.telemetry) {
    const files = Object.keys(docx).map((filePath) => {
      const parts = filePath.split('/');
      return {
        filePath,
        fileDepth: parts.length,
        fileType: filePath.split('.').pop(),
      };
    });

    converter.telemetry.trackFileStructure({
      totalFiles: files.length,
      maxDepth: Math.max(...files.map((f) => f.fileDepth)),
      totalNodes: 0,
      files,
    });
  }

  const nodeListHandler = defaultNodeListHandler();
  const bodyNode = json.elements[0].elements.find((el) => el.name === 'w:body');

  if (bodyNode) {
    const node = bodyNode;
    const ignoreNodes = ['w:sectPr'];
    const content = node.elements?.filter((n) => !ignoreNodes.includes(n.name)) ?? [];

    const parsedContent = nodeListHandler.handler({
      nodes: content,
      nodeListHandler,
      docx,
      converter,
      editor,
    });

    const result = {
      type: 'doc',
      content: parsedContent,
      attrs: {
        attributes: json.elements[0].attributes,
      },
    };

    if (result.content.length === 0) {
      converter?.telemetry?.trackParsing(
        converter?.fileSource,
        converter?.documentId,
        'document',
        'parse_empty',
        'word/document.xml',
        {
          documentType: 'docx',
          internalId: converter?.documentInternalId,
          timestamp: new Date().toISOString(),
          contentLength: 0,
          statistics: converter?.telemetry?.statistics,
          fileStructure: converter?.telemetry?.fileStructure,
        },
      );
    }

    return {
      pmDoc: result,
      savedTagsToRestore: node,
      pageStyles: getDocumentStyles(node, docx, converter, editor),
    };
  }
  return null;
};

export const defaultNodeListHandler = () => {
  const entities = [
    runNodeHandlerEntity,
    paragraphNodeHandlerEntity,
    listHandlerEntity,
    textNodeHandlerEntity,
    lineBreakNodeHandlerEntity,
    annotationNodeHandlerEntity,
    bookmarkNodeHandlerEntity,
    hyperlinkNodeHandlerEntity,
    drawingNodeHandlerEntity,
    trackChangeNodeHandlerEntity,
    tableNodeHandlerEntity,
    tabNodeEntityHandler,
    standardNodeHandlerEntity, //this should be the last one, bcs this parses everything!!!
  ];

  const handler = createNodeListHandler(entities);
  return {
    handler,
    handlerEntities: entities,
  };
};

/**
 *
 * @param {NodeHandlerEntry[]} nodeHandlers
 */
const createNodeListHandler = (nodeHandlers) => {
  /**
   * Gets safe element context even if index is out of bounds
   * @param {Array} elements Array of elements
   * @param {number} index Index to check
   * @returns {Object} Safe context object
   */
  const getSafeElementContext = (elements, index) => {
    if (!elements || index < 0 || index >= elements.length) {
      return {
        elementIndex: index,
        error: 'index_out_of_bounds',
        arrayLength: elements?.length,
      };
    }

    const element = elements[index];
    return {
      elementIndex: index,
      elementName: element?.name,
      elementAttributes: element?.attributes,
      hasElements: !!element?.elements,
      elementCount: element?.elements?.length,
    };
  };

  const nodeListHandlerFn = ({ nodes: elements, docx, insideTrackChange, converter, editor, filename }) => {
    if (!elements || !elements.length) return [];

    const processedElements = [];
    const unhandledNodes = [];

    try {
      for (let index = 0; index < elements.length; index++) {
        try {
          const nodesToHandle = elements.slice(index);
          if (!nodesToHandle || nodesToHandle.length === 0) {
            continue;
          }

          const { nodes, consumed, unhandled } = nodeHandlers.reduce(
            (res, handler) => {
              if (res.consumed > 0) return res;

              return handler.handler({
                nodes: nodesToHandle,
                docx,
                nodeListHandler: { handler: nodeListHandlerFn, handlerEntities: nodeHandlers },
                insideTrackChange,
                converter,
                editor,
                filename,
              });
            },
            { nodes: [], consumed: 0 },
          );

          // Only track unhandled nodes that should have been handled
          if (unhandled) {
            const context = getSafeElementContext(elements, index);
            if (!context.elementName) continue;

            const ignoredElements = ['w:sectPr', 'w:lastRenderedPageBreak'];
            if (!ignoredElements.includes(context.elementName)) {
              converter?.telemetry?.trackParsing(
                converter?.fileSource,
                converter?.documentId,
                'node',
                'unhandled',
                `/word/${filename || 'document.xml'}`,
                {
                  context,
                  internalId: converter?.documentInternalId,
                },
              );
            }
            continue;
          }

          // Process and store nodes (no tracking needed for success)
          if (nodes) {
            nodes.forEach((node) => {
              if (node?.type && !['runProperties'].includes(node.type)) {
                if (node.type === 'text' && Array.isArray(node.content) && !node.content.length) {l
                  return;
                }
                processedElements.push(node);
              }
            });
          }
        } catch (error) {
          editor?.emit('exception', { error });

          converter?.telemetry?.trackParsing(
            converter?.fileSource,
            converter?.documentId,
            'element',
            'processing_error',
            `/word/${filename || 'document.xml'}`,
            {
              error: {
                message: error.message,
                name: error.name,
                stack: error.stack,
              },
              internalId: converter?.documentInternalId,
              context: getSafeElementContext(elements, index),
            },
          );
        }
      }

      return processedElements;
    } catch (error) {
      editor?.emit('exception', { error });

      // Track only catastrophic handler failures
      converter?.telemetry?.trackParsing(
        converter?.fileSource,
        converter?.documentId,
        'handler',
        'fatal_error',
        `/word/${filename || 'document.xml'}`,
        {
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          internalId: converter?.documentInternalId,
          context: {
            totalElements: elements?.length || 0,
            processedCount: processedElements.length,
            unhandledCount: unhandledNodes.length,
          },
        },
      );
      throw error;
    }
  };
  return nodeListHandlerFn;
};

/**
 *
 * @param {XmlNode} node
 * @returns {Object} The document styles object
 */
function getDocumentStyles(node, docx, converter, editor) {
  const sectPr = node.elements?.find((n) => n.name === 'w:sectPr');
  const styles = {};

  sectPr?.elements?.forEach((el) => {
    const { name, attributes } = el;
    switch (name) {
      case 'w:pgSz':
        styles['pageSize'] = {
          width: twipsToInches(attributes['w:w']),
          height: twipsToInches(attributes['w:h']),
        };
        break;
      case 'w:pgMar':
        styles['pageMargins'] = {
          top: twipsToInches(attributes['w:top']),
          right: twipsToInches(attributes['w:right']),
          bottom: twipsToInches(attributes['w:bottom']),
          left: twipsToInches(attributes['w:left']),
          header: twipsToInches(attributes['w:header']),
          footer: twipsToInches(attributes['w:footer']),
          gutter: twipsToInches(attributes['w:gutter']),
        };
        break;
      case 'w:cols':
        styles['columns'] = {
          space: twipsToInches(attributes['w:space']),
          num: attributes['w:num'],
          equalWidth: attributes['w:equalWidth'],
        };
        break;
      case 'w:docGrid':
        styles['docGrid'] = {
          linePitch: twipsToInches(attributes['w:linePitch']),
          type: attributes['w:type'],
        };
        break;
      case 'w:headerReference':
        getHeaderFooter(el, 'header', docx, converter, editor);
        break;
      case 'w:footerReference':
        getHeaderFooter(el, 'footer', docx, converter, editor);
        break;
    }
  });
  return styles;
}

function getHeaderFooter(el, elementType, docx, converter, editor) {
  const rels = docx['word/_rels/document.xml.rels'];
  const relationships = rels.elements.find((el) => el.name === 'Relationships');
  const { elements } = relationships;

  // sectionType as in default, first, odd, even
  const sectionType = el.attributes['w:type'];

  const rId = el.attributes['r:id'];
  const rel = elements.find((el) => el.attributes['Id'] === rId);
  const target = rel.attributes['Target'];

  // Get the referenced file (ie: header1.xml)
  const referenceFile = docx[`word/${target}`];
  const currentFileName = target;

  const nodeListHandler = defaultNodeListHandler();
  const schema = nodeListHandler.handler({
    nodes: referenceFile.elements[0].elements,
    nodeListHandler,
    docx,
    converter,
    editor,
    filename: currentFileName,
  });

  let storage, storageIds;

  if (elementType === 'header') {
    storage = converter.headers;
    storageIds = converter.headerIds;
  } else if (elementType === 'footer') {
    storage = converter.footers;
    storageIds = converter.footerIds;
  }

  storage[rId] = { type: 'doc', content: [...schema] };
  storageIds[sectionType] = rId;
}
