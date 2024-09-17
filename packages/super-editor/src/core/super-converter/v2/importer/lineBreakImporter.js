/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleLineBreakNode = (nodes, docx, nodeListHandler, insideTrackChange)  => {
    if(nodes.length === 0 || nodes[0].name !== 'w:br') {
        return [];
    }

    const attrs = {};

    const lineBreakType = nodes[0].attributes?.['w:type'];
    if (lineBreakType) attrs['lineBreakType'] = lineBreakType;


    return [{
            type: 'lineBreak',
            content: [],
            attrs,
        }];
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const lineBreakNodeHandlerEntity = {
    handlerName: 'lineBreakNodeHandler',
    handler: handleLineBreakNode
}