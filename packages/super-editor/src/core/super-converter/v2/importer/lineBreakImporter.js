/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleLineBreakNode = (nodes, docx, nodeListHandler, insideTrackChange)  => {
    if(nodes.length === 0 || nodes[0].name !== 'w:br') {
        return {nodes: [], consumed: 0};
    }

    return {
        nodes: [{
            type: 'lineBreak',
            content: [],
            attrs: {},
        }], consumed: 1
    };
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const lineBreakNodeHandlerEntity = {
    handlerName: 'lineBreakNodeHandler',
    handler: handleLineBreakNode
}