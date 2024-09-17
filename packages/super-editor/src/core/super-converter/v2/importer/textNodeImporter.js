import {getElementName, parseProperties} from "./importerHelpers.js";


/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleTextNode =  (nodes, docx, nodeListHandler, insideTrackChange = false) => {
    if(nodes.length === 0 || !(nodes[0].name === 'w:t' || (insideTrackChange && nodes[0].name === 'w:delText'))) {
        return [];
    }
    const node = nodes[0];
    const { type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = parseProperties(node, docx, nodeListHandler, insideTrackChange);

    // Text nodes have no children. Only text, and there should only be one child
    let text;
    if (elements.length === 1) text = elements[0].text;

    // Word sometimes will have an empty text node with a space attribute, in that case it should be a space
    else if (!elements.length && 'attributes' in node && node.attributes['xml:space'] === 'preserve') {
        text = ' ';
    }

    // Ignore others - can catch other special cases here if necessary
    else return [];

    return [{
        type: getElementName(node),
        text: text,
        attrs: { type, attributes: attributes || {}, },
        marks,
    }];
}


/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const textNodeHandlerEntity = {
    handlerName: 'textNodeHandler',
    handler: handleTextNode
};