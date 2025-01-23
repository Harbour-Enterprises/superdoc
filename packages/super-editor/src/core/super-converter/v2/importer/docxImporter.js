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
import { baseNumbering } from '../exporter/helpers/base-list.definitions.js';

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
 * @returns {{pmDoc: PmNodeJson, savedTagsToRestore: XmlNode, pageStyles: *}|null}
*/
export const createDocumentJson = (docx, converter) => {
  const json = carbonCopy(getInitialJSON(docx));
  if (!json) return null;

  const nodeListHandler = defaultNodeListHandler();

  const bodyNode = json.elements[0].elements.find((el) => el.name === 'w:body');
  if (bodyNode) {
    const node = bodyNode;
    const ignoreNodes = ['w:sectPr'];
    const content = node.elements?.filter((n) => !ignoreNodes.includes(n.name)) ?? [];

    // Track imported lists
    const lists = {};
    const parsedContent = nodeListHandler.handler(content, docx, false, null, lists);
    const result = {
      type: 'doc',
      content: parsedContent,
      attrs: {
        attributes: json.elements[0].attributes,
      },
    };
    return {
      pmDoc: result,
      savedTagsToRestore: node,
      pageStyles: getDocumentStyles(node, docx, converter),
      numbering: getNumberingDefinitions(docx),
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
   * @param {XmlNode[]} elements
   * @param {ParsedDocx} docx
   * @param {boolean} insideTrackChange
   * @param {string} filename
   * @return {{type: string, content: *, attrs: {attributes}}[]}
   */
  const nodeListHandlerFn = (elements, docx, insideTrackChange, filename, lists) => {
    if (!elements || !elements.length) return [];
    const processedElements = [];

    for (let index = 0; index < elements.length; index++) {
      const { nodes, consumed } = nodeHandlers.reduce(
        (res, handler) => {
          if (res.consumed > 0) return res;
          const nodesToHandle = elements.slice(index);
          if (!nodesToHandle || nodesToHandle.length === 0) return res;
          const result = handler.handler(
            nodesToHandle,
            docx,
            { handler: nodeListHandlerFn, handlerEntities: nodeHandlers },
            insideTrackChange,
            filename,
            lists,
          );
          return result;
        },
        { nodes: [], consumed: 0 },
      );
      index += consumed - 1;
      if (consumed === 0) {
        console.warn("We have a node that we can't handle!", elements[index]);
      }
      for (let node of nodes) {
        if (node?.type) {
          const ignore = ['runProperties'];

          // Ignore empty text nodes
          if (node.type === 'text' && Array.isArray(node.content) && !node.content.length) continue;
          if (!ignore.includes(node.type)) processedElements.push(node);
        }
      }
    }
    return processedElements;
  };

  return nodeListHandlerFn;
};

/**
 *
 * @param {XmlNode} node
 * @returns {Object} The document styles object
 */
function getDocumentStyles(node, docx, converter) {
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
        getHeaderFooter(el, 'header', docx, converter);
        break;
      case 'w:footerReference':
        getHeaderFooter(el, 'footer', docx, converter);
        break;
    }
  });
  return styles;
}

function getHeaderFooter(el, elementType, docx, converter) {
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
  const schema = nodeListHandler.handler(referenceFile.elements[0].elements, docx, false, currentFileName);

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
};

/**
 * Import this document's numbering.xml definitions
 * They will be stored into converter.numbering
 * 
 * @param {Object} docx The parsed docx
 * @returns {Object} The numbering definitions
 */
function getNumberingDefinitions(docx) {
  let numbering = docx['word/numbering.xml'];
  if (!numbering) numbering = baseNumbering;

  const elements = numbering.elements[0].elements;

  const abstractDefs = elements.filter((el) => el.name === 'w:abstractNum');
  const definitions = elements.filter((el) => el.name === 'w:num');

  const abstractDefinitions = {};
  abstractDefs.forEach((el) => {
    const abstractId = Number(el.attributes['w:abstractNumId']);
    abstractDefinitions[abstractId] = el;
  });

  const importListDefs = {};
  definitions.forEach((el) => {
    const numId = Number(el.attributes['w:numId']);
    importListDefs[numId] = el;
  });

  return {
    abstracts: abstractDefinitions,
    definitions: importListDefs,
  }
}