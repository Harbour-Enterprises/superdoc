import {halfPointToPixels, twipsToInches, twipsToPixels} from "../../helpers.js";


/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleAllTableNodes = (nodes, docx, nodeListHandler, insideTrackChange) => {
    if(nodes.length === 0) {
        return {nodes: [], consumed: 0};
    }
    const node = nodes[0];

    switch (node.name) {
        case 'w:tbl':
            return {nodes: [handleTableNode(node, docx, nodeListHandler)], consumed: 1};
        case 'w:tr':
            return {nodes: [handleTableRowNode(node, undefined, docx, nodeListHandler, insideTrackChange)], consumed: 1};
        case 'w:tc':
            return {nodes: [handleTableCellNode(node, docx, nodeListHandler, insideTrackChange)], consumed: 1};
    }

    return {nodes: [], consumed: 0};
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const tableNodeHandlerEntity = {
    handlerName: 'tableNodeHandler',
    handler: handleAllTableNodes
};



/**
 *
 * @param {XmlNode} node
 * @param {ParsedDocx} docx
 * @param {NodeListHandler} nodeListHandler
 * @param {boolean} insideTrackChange
 * @returns {{type: string, content: *, attrs: {borders: *, tableWidth: *, tableWidthType: *, gridColumnWidths: *}}}
 */
export function handleTableNode(node, docx, nodeListHandler, insideTrackChange) {
    // Table styles
    const tblPr = node.elements.find((el) => el.name === 'w:tblPr');

    // Table borders can be specified in tblPr or inside a referenced style tag
    const tableBordersElement = tblPr.elements.find((el) => el.name === 'w:tblBorders');
    const tableBorders = tableBordersElement?.elements || [];
    const { borders, rowBorders } = processTableBorders(tableBorders);
    const tblStyleTag = tblPr.elements.find((el) => el.name === 'w:tblStyle');

    const tableStyleId = tblStyleTag?.attributes['w:val'];

    // Other table properties
    const tableIndent = tblPr?.elements.find((el) => el.name === 'w:tblInd');
    const tableLayout = tblPr?.elements.find((el) => el.name === 'w:tblLayout');

    const referencedStyles = getReferencedTableStyles(tblStyleTag, docx);

    const tblW = tblPr.elements.find((el) => el.name === 'w:tblW');
    const tableWidth = twipsToInches(tblW.attributes['w:w']);
    const tableWidthType = tblW.attributes['w:type'];

    // TODO: What does this do?
    // const tblLook = tblPr.elements.find((el) => el.name === 'w:tblLook');
    const tblGrid = node.elements.find((el) => el.name === 'w:tblGrid');
    const gridColumnWidths = tblGrid.elements.map((el) => twipsToInches(el.attributes['w:w']));

    const rows = node.elements.filter((el) => el.name === 'w:tr');

    const borderData = Object.keys(borders)?.length ? borders : referencedStyles.borders;
    const borderRowData = Object.keys(rowBorders)?.length ? rowBorders : referencedStyles.rowBorders;
    const content = rows.map((row) => handleTableRowNode(row, borderRowData, docx, nodeListHandler, insideTrackChange));

    return {
        type: 'table',
        content,
        attrs: {
            tableWidth,
            tableWidthType,
            gridColumnWidths,
            tableStyleId,
            tableIndent,
            tableLayout,
            borders: borderData
        }
    }
}


/**
 *
 * @param node
 * @param {ParsedDocx} docx
 * @param {NodeListHandler} nodeListHandler
 * @param {boolean} insideTrackChange
 * @returns {{type: string, content: (*|*[]), attrs: {}}}
 */
export function handleTableCellNode(node, docx, nodeListHandler, insideTrackChange) {
    const tcPr = node.elements.find((el) => el.name === 'w:tcPr');
    const borders = tcPr?.elements?.find((el) => el.name === 'w:tcBorders');
    const tcWidth = tcPr?.elements?.find((el) => el.name === 'w:tcW');
    const width = tcWidth ? twipsToInches(tcWidth.attributes['w:w']) : null;
    const widthType = tcWidth?.attributes['w:type'];

    // TODO: Do we need other background attrs?
    const backgroundColor = tcPr?.elements?.find((el) => el.name === 'w:shd');
    const background = {
        color: backgroundColor?.attributes['w:fill'],
    }

    const colspanTag = tcPr?.elements?.find((el) => el.name === 'w:gridSpan');
    const colspan = colspanTag?.attributes['w:val'];

    const marginTag = tcPr?.elements?.find((el) => el.name === 'w:tcMar');
    const marginLeft = marginTag?.elements?.find((el) => el.name === 'w:left');
    const marginRight = marginTag?.elements?.find((el) => el.name === 'w:right');
    const marginTop = marginTag?.elements?.find((el) => el.name === 'w:top');
    const marginBottom = marginTag?.elements?.find((el) => el.name === 'w:bottom');

    const verticalAlignTag = tcPr?.elements?.find((el) => el.name === 'w:vAlign');
    const verticalAlign = verticalAlignTag?.attributes['w:val'];

    const attributes = {};
    if (width) attributes['width'] = width;
    if (widthType) attributes['widthType'] = widthType;
    if (colspan) attributes['colspan'] = colspan;
    if (background) attributes['background'] = background;
    if (verticalAlign) attributes['verticalAlign'] = verticalAlign;

    return {
        type: 'tableCell',
        content: nodeListHandler.handler(node.elements, docx, insideTrackChange),
        attrs: attributes,
    }
}

/**
 *
 * @param tblStyleTag
 * @param {ParsedDocx} docx
 * @param {NodeListHandler} nodeListHandler
 * @returns {{uiPriotity: *, borders: {}, name: *, rowBorders: {}, basedOn: *}|null}
 */
function getReferencedTableStyles(tblStyleTag, docx, nodeListHandler) {
    if (!tblStyleTag) return null;

    const { attributes } = tblStyleTag;
    const tableStyleReference = attributes['w:val'];
    if (!tableStyleReference) return null;

    const styles = docx['word/styles.xml'];
    const { elements } = styles.elements[0];
    const styleElements = elements.filter((el) => el.name === 'w:style');
    const styleTag = styleElements.find((el) => el.attributes['w:styleId'] === tableStyleReference);
    if (!styleTag) return null;

    const name = styleTag.elements.find((el) => el.name === 'w:name');
    const basedOn = styleTag.elements.find((el) => el.name === 'w:basedOn');
    const uiPriotity = styleTag.elements.find((el) => el.name === 'w:uiPriority');

    const tblPr = styleTag.elements.find((el) => el.name === 'w:tblPr');
    const tableBorders = tblPr?.elements.find((el) => el.name === 'w:tblBorders');
    const { elements: borderElements = [] } = tableBorders || {};
    const { borders, rowBorders } = processTableBorders(borderElements);

    return {
        name,
        basedOn,
        uiPriotity,
        borders,
        rowBorders,
    }
}

function processTableBorders(borderElements) {
    const borders = {};
    const rowBorders = {};
    borderElements.forEach((borderElement) => {
        const { name } = borderElement;
        const borderName = name.split('w:')[1];
        const { attributes } = borderElement;

        const attrs = {};
        const color = attributes['w:color'];
        const size = attributes['w:sz'];
        if (color && color !== 'auto') attrs['color'] = `#${color}`;
        if (size && size !== 'auto') attrs['size'] = halfPointToPixels(size);

        const rowBorderNames = ['insideH', 'insideV'];
        if (rowBorderNames.includes(borderName)) rowBorders[borderName] = attrs;
        borders[borderName] = attrs;
    });

    return {
        borders,
        rowBorders
    }
}

/**
 *
 * @param node
 * @param {undefined | null | {insideH?: *, insideV?: *}} rowBorders
 * @param {ParsedDocx} docx
 * @param {NodeListHandler} nodeListHandler
 * @param {boolean} insideTrackChange
 * @returns {*}
 */
export function handleTableRowNode(node, rowBorders, docx, nodeListHandler, insideTrackChange) {
    const handleStandardNode = nodeListHandler.handlerEntities.find(e => e.handlerName === 'standardNodeHandler')?.handler;
    if (!handleStandardNode) {
        console.error('Standard node handler not found');
        return {nodes: [], consumed: 0};
    }

    const newNodes = handleStandardNode([node], docx, nodeListHandler, insideTrackChange);
    if(newNodes.nodes.length === 0) {
        return {nodes: [], consumed: 0};
    }
    const newNode = newNodes.nodes[0];

    const tPr = node.elements.find((el) => el.name === 'w:trPr');
    const rowHeightTag = tPr?.elements.find((el) => el.name === 'w:trHeight');
    const rowHeight = rowHeightTag?.attributes['w:val'];
    const rowHeightRule = rowHeightTag?.attributes['w:hRule'];

    const borders = {};
    if (rowBorders?.insideH) borders['bottom'] = rowBorders.insideH;
    if (rowBorders?.insideV) borders['right'] = rowBorders.insideV;
    if(!newNode.attrs) newNode.attrs = {};
    newNode.attrs['borders'] = borders;

    if (rowHeight) {
        newNode.attrs['rowHeight'] = twipsToPixels(rowHeight);
        console.debug('Row node:', newNode);
    }

    return newNode;
}
