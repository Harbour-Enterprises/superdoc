import {getElementName, parseProperties} from "./importerHelpers.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleStandardNode = (nodes, docx, nodeListHandler, insideTrackChange = false) => {
    if(!nodes || nodes.length === 0) {
        return [];
    }
    const node = nodes[0];
    // Parse properties
    const { name, type } = node;
    const { attributes, elements, marks = [] } = parseProperties(node, docx, nodeListHandler, insideTrackChange);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
        const updatedElements = elements.map((el) => {
            if (!el.marks) el.marks = [];
            el.marks.push(...marks);
            return el;
        })
        content.push(...nodeListHandler.handler(updatedElements, docx, insideTrackChange));
    }

    const resultNode = {
        type: getElementName(node),
        content,
        attrs: { ...attributes },
        marks: [],
    };

    if(node.name === 'w:tab') {
        resultNode.content = [{ type: 'text', text: ' ' }];
        return [resultNode];
    } else {
        return [resultNode];
    }
}


/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const standardNodeHandlerEntity = {
    handlerName: 'standardNodeHandler',
    handler: handleStandardNode
};