import {convertToSchema} from "./docxImporter.js";
import {getElementName, parseProperties} from "./importerHelpers.js";
import {handleTextNode} from "./textNodeImporter.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleStandardNode = (nodes, docx, nodeListHandler, insideTrackChange = false) => {
    if(!nodes || nodes.length === 0) {
        return {nodes: [], consumed: 0};
    }
    const node = nodes[0];
    // Parse properties
    const { name, type } = node;
    const { attributes, elements, marks = [] } = parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
        const updatedElements = elements.map((el) => {
            if (!el.marks) el.marks = [];
            el.marks.push(...marks);
            return el;
        })
        content.push(...nodeListHandler.handler(updatedElements));
    }

    const resultNode = {
        type: getElementName(node),
        content,
        attrs: { ...attributes },
        marks: [],
    };

    if(node.name === 'w:tab') {
        resultNode.content = [{ type: 'text', text: ' ' }];
        return { nodes: [resultNode], consumed: 1 };
    } else {
        return { nodes: [resultNode], consumed: 1 };
    }
}


/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const standardNodeHandlerEntity = {
    handlerName: 'standardNodeHandler',
    handler: handleStandardNode
};