import { twipsToPixels } from "../../helpers.js";
import { testForList } from "./listImporter.js";
import { carbonCopy } from "../../../utilities/carbonCopy.js";

/**
 * Special cases of w:p based on paragraph properties
 *
 * If we detect a list node, we need to get all nodes that are also lists and process them together
 * in order to combine list item nodes into list nodes.
 *
 * @type {import("docxImporter").NodeHandler}
 */
export const handleParagraphNode = (nodes, docx, nodeListHandler, insideTrackChange) => {
  if (nodes.length === 0 || nodes[0].name !== 'w:p') {
    return { nodes: [], consumed: 0 };
  }
  const node = carbonCopy(nodes[0])

  let schemaNode;

  // We need to pre-process paragraph nodes to combine various possible elements we will find ie: lists, links.
  const processedElements = preProcessNodesForFldChar(node.elements);
  node.elements = processedElements;

  // Check if this paragraph node is a list
  if (testForList(node)) {
    return { nodes: [], consumed: 0 };
  }

  // If it is a standard paragraph node, process normally
  const handleStandardNode = nodeListHandler.handlerEntities.find(e => e.handlerName === 'standardNodeHandler')?.handler;
  if (!handleStandardNode) {
    console.error('Standard node handler not found');
    return { nodes: [], consumed: 0 };
  }
  const result = handleStandardNode([node], docx, nodeListHandler, insideTrackChange);
  if (result.nodes.length === 1) {
    schemaNode = result.nodes[0];
  }

  if ('attributes' in node) {
    const defaultStyleId = node.attributes['w:rsidRDefault'];

    const pPr = node.elements.find((el) => el.name === 'w:pPr');
    const styleTag = pPr?.elements.find((el) => el.name === 'w:pStyle');
    if (styleTag) {
      schemaNode.attrs['styleId'] = styleTag.attributes['w:val'];
    }

    const indent = pPr?.elements.find((el) => el.name === 'w:ind');
    if (indent) {
      const { 'w:left': left, 'w:right': right, 'w:firstLine': firstLine } = indent.attributes;
      schemaNode.attrs['indent'] = {
        left: twipsToPixels(left),
        right: twipsToPixels(right),
        firstLine: twipsToPixels(firstLine),
      };
    }

    const justify = pPr?.elements.find((el) => el.name === 'w:jc');
    if (justify) {
      schemaNode.attrs['textAlign'] = justify.attributes['w:val'];
    }

    const { lineSpaceAfter, lineSpaceBefore } = getDefaultStyleDefinition(defaultStyleId, docx);
    const spacing = pPr?.elements.find((el) => el.name === 'w:spacing');
    if (spacing) {
      const {
        'w:after': lineSpaceAfterInLine,
        'w:before': lineSpaceBeforeInLine,
        'w:line': lineInLine,
      } = spacing.attributes;

      schemaNode.attrs['spacing'] = {
        lineSpaceAfter: twipsToPixels(lineSpaceAfterInLine) || lineSpaceAfter,
        lineSpaceBefore: twipsToPixels(lineSpaceBeforeInLine) || lineSpaceBefore,
        line: twipsToPixels(lineInLine),
      };
    }
  }
  return { nodes: schemaNode ? [schemaNode] : [], consumed: 1 };
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const paragraphNodeHandlerEntity = {
  handlerName: 'paragraphNodeHandler',
  handler: handleParagraphNode
};


/**
 * TODO: There are so many possible styles here - confirm what else we need.
 * @param {string} defaultStyleId
 * @param {ParsedDocx} docx
 */
function getDefaultStyleDefinition(defaultStyleId, docx) {
  const result = { lineSpaceBefore: null, lineSpaceAfter: null };
  const styles = docx['word/styles.xml'];
  if (!styles) return result;

  const { elements } = styles.elements[0];
  // console.debug('Default style ID elements:', elements)
  const elementsWithId = elements.filter((el) => {
    return el.elements.some((e) => {
      return 'attributes' in e && e.attributes['w:val'] === defaultStyleId;
    });
  });

  const firstMatch = elementsWithId[0];
  if (!firstMatch) return result;

  const pPr = firstMatch.elements.find((el) => el.name === 'w:pPr');
  const spacing = pPr?.elements.find((el) => el.name === 'w:spacing');
  if (!spacing) return result;
  const lineSpaceBefore = twipsToPixels(spacing.attributes['w:before']);
  const lineSpaceAfter = twipsToPixels(spacing.attributes['w:after']);
  return { lineSpaceBefore, lineSpaceAfter };
}

/**
 * We need to pre-process nodes in a paragraph to combine nodes together where necessary ie: links
 * TODO: Likely will find more w:fldChar to deal with.
 *
 * @param {XmlNode[]} nodes
 * @returns
 */
export function preProcessNodesForFldChar(nodes) {
  const processedNodes = [];
  const nodesToCombine = [];
  let isCombiningNodes = false;
  nodes?.forEach((n) => {
    const fldChar = n.elements?.find((el) => el.name === 'w:fldChar');
    if (fldChar) {
      const fldType = fldChar.attributes['w:fldCharType'];
      if (fldType === 'begin') {
        isCombiningNodes = true;
        nodesToCombine.push(n);
      } else if (fldType === 'end') {
        nodesToCombine.push(n);
        isCombiningNodes = false;
      }
    }

    if (isCombiningNodes) {
      nodesToCombine.push(n);
    } else if (!isCombiningNodes && nodesToCombine.length) {

      // Need to extract all nodes between 'separate' and 'end' fldChar nodes
      const textStart = nodesToCombine.findIndex((n) => n.elements?.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'separate'));
      const textEnd = nodesToCombine.findIndex((n) => n.elements?.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'end'));
      const textNodes = nodesToCombine.slice(textStart + 1, textEnd);
      const instrText = nodesToCombine.find((n) => n.elements?.some((el) => el.name === 'w:instrText'))?.elements[0]?.elements[0].text;
      const urlMatch = instrText?.match(/HYPERLINK\s+"([^"]+)"/);

      if (!urlMatch || urlMatch?.length < 2) return [];
      const url = urlMatch[1];

      const textMarks = [];
      textNodes.forEach((n) => {
        const rPr = n.elements.find((el) => el.name === 'w:rPr');
        if (!rPr) return;

        const { elements } = rPr;
        elements.forEach((el) => {
          textMarks.push(el);
        });
      });

      // Create a rPr and replace all nodes with the updated node.
      const linkMark = { name: 'link', attributes: { href: url } };
      const rPr = { name: 'w:rPr', type: 'element', elements: [linkMark, ...textMarks] }
      processedNodes.push({
        name: 'w:r',
        type: 'element',
        elements: [rPr, ...textNodes]
      });
    } else {
      processedNodes.push(n);
    }
  })
  return processedNodes;
}