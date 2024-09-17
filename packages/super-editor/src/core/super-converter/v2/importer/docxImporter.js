import {getInitialJSON} from "../docxHelper.js";
import {carbonCopy} from "../../../utilities/cabonCopy.js";
import {twipsToInches} from "../../helpers.js";
import {tableNodeHandlerEntity} from "./tableImporter.js";
import {drawingNodeHandlerEntity} from "./imageImporter.js";
import {
    handleParagraphNodeChange,
    nodeTypeChangeAttributeChanger,
    trackChangeNodeHandlerEntity
} from "./trackChangesImporter.js";
import {hyperlinkNodeHandlerEntity} from "./hyperlinkImporter.js";
import {runNodeHandlerEntity} from "./runNodeImporter.js";
import {textNodeHandlerEntity} from "./textNodeImporter.js";
import {paragraphNodeHandlerEntity} from "./paragraphNodeImporter.js";
import {standardNodeHandlerEntity} from "./standardNodeImporter.js";
import {lineBreakNodeHandlerEntity} from "./lineBreakImporter.js";
import {bookmarkNodeHandlerEntity} from "./bookmarkNodeImporter.js";
import {listHandlerEntity, listNodeAggregator} from "./listImporter.js";

/**
 * @typedef {import()} XmlNode
 * @typedef {{type: string, content: *, attrs: {}}} PmNodeJson
 * @typedef {{type: string, attrs: {}}} PmMarkJson
 *
 * @typedef {(nodes: XmlNode[], docx: ParsedDocx, insideTrackCahange: boolean) => PmNodeJson[]} NodeListHandlerFn
 * @typedef {{handler: NodeListHandlerFn, handlerEntities: NodeHandlerEntry[]}} NodeListHandler
 *
 * @typedef {(nodes: XmlNode[], docx: ParsedDocx, nodeListHandler: NodeListHandler, insideTrackCahange: boolean) => PmNodeJson[]} NodeHandler
 * @typedef {{handlerName: string, handler: NodeHandler}} NodeHandlerEntry
 */

/**
 *
 * @param {ParsedDocx} docx
 * @returns {{pmDoc: PmNodeJson, savedTagsToRestore: XmlNode, pageStyles: *}|null}
 */
export const createDocumentJson = (docx) => {
    const json = carbonCopy(getInitialJSON(docx));
    if (!json) return null;

    console.debug('\n\n JSON', json,)
    const nodeListHandler = defaultNodeListHandler();
    if(json.elements[0].elements[0].name === 'w:body') {
        const node = json.elements[0].elements[0];
        const ignoreNodes = ['w:sectPr'];
        const content = node.elements?.filter((n) => !ignoreNodes.includes(n.name)) ?? [];

        const result = {
            type: 'doc',
            content: nodeListHandler.handler(content, docx, false),
            attrs: {
                attributes: json.elements[0].attributes,
            }
        }
        return {
            pmDoc: result,
            savedTagsToRestore: node,
            pageStyles: getDocumentStyles(node),
        };
    }
    return null;
}

/**
 * @returns {NodeListHandler}
 */
export const defaultNodeListHandler = () => {
    const entities = [
        runNodeHandlerEntity,
        paragraphNodeHandlerEntity,
        listHandlerEntity,
        textNodeHandlerEntity,
        lineBreakNodeHandlerEntity,
        bookmarkNodeHandlerEntity,
        hyperlinkNodeHandlerEntity,
        drawingNodeHandlerEntity,
        trackChangeNodeHandlerEntity,
        tableNodeHandlerEntity,
        standardNodeHandlerEntity, //this should be the last one, bcs this parses everything!!!
    ]
    const handler = createNodeListHandler(entities);
    return {
        handler,
        handlerEntities: entities
    }
}

/**
 *
 * @param {NodeHandlerEntry[]} nodeHandlers
 */
const createNodeListHandler = (nodeHandlers) => {
    /**
     * @param {XmlNode[]} elements
     * @param {ParsedDocx} docx
     * @param {boolean} insideTrackChange
     * @return {{type: string, content: *, attrs: {attributes}}[]}
     */
    const nodeListHandlerFn = (elements, docx, insideTrackChange) => {
        if (!elements || !elements.length) return [];

        const handlerObj = {handler: nodeListHandlerFn, handlerEntities: nodeHandlers}
        const processedElements = [];

        for (let index = 0; index < elements.length; index++) {
            const nodes = nodeHandlers.reduce((res, handler) => {
                if(res.length > 0) return res;
                const nodesToHandle = elements.slice(index);
                if(!nodesToHandle || nodesToHandle.length === 0) return res;
                const handlerResponse =  handler.handler(nodesToHandle, docx, handlerObj, insideTrackChange);
                if(handlerResponse.length > 0) {
                    handleParagraphNodeChange(nodesToHandle[0], handlerResponse[0], docx, handlerObj)
                    return handlerResponse;
                }
                return res
            }, []);
            if(nodes.length === 0)  {
                console.warn("We have a node that we can't handle!", elements[index])
            }
            for(let node of nodes) {
                if (node?.type) {
                    const ignore = ['runProperties'];
                    if (!ignore.includes(node.type)) processedElements.push(node);
                }
            }
        }

        const aggregatedNodes = listNodeAggregator(processedElements, docx, handlerObj);

        return aggregatedNodes;
    }

    return nodeListHandlerFn;
}

/**
 *
 * @param {XmlNode} node
 * @returns {*}
 */
function getDocumentStyles(node) {
    const sectPr = node.elements.find((n) => n.name === 'w:sectPr');
    const styles = {};

    sectPr.elements.forEach((el) => {
        const { name, attributes } = el;
        switch (name) {
            case 'w:pgSz':
                styles['pageSize'] = {
                    width: twipsToInches(attributes['w:w']),
                    height: twipsToInches(attributes['w:h']),
                }
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
                }
                break;
            case 'w:cols':
                styles['columns'] = {
                    space: twipsToInches(attributes['w:space']),
                    num: attributes['w:num'],
                    equalWidth: attributes['w:equalWidth'],
                }
                break;
            case 'w:docGrid':
                styles['docGrid'] = {
                    linePitch: twipsToInches(attributes['w:linePitch']),
                    type: attributes['w:type'],
                }
                break;
        }
    });
    return styles;
}