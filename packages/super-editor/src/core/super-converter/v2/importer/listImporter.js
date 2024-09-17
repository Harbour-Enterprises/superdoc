import {carbonCopy} from "../../../utilities/cabonCopy.js";
import {parseProperties} from "./importerHelpers.js";
import {preProcessNodesForFldChar} from "./paragraphNodeImporter.js";
import {windowingSplit} from "../../../utilities/windowingSplit.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleListNode = (nodes, docx, nodeListHandler, insideTrackChange)  => {
    if(nodes.length === 0 || nodes[0].name !== 'w:p') {
        return [];
    }
    const node = carbonCopy(nodes[0])

    // We need to pre-process paragraph nodes to combine various possible elements we will find ie: lists, links.
    const processedElements = preProcessNodesForFldChar(node.elements);
    node.elements = processedElements;

    // Check if this paragraph node is a list
    if (testForList(node)) {
        return singleNodeTransform(node, docx, nodeListHandler, insideTrackChange)
    } else {
        return [];
    }
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const listHandlerEntity = {
    handlerName: 'listHandler',
    handler: handleListNode
}

/**
 * Single node transform
 * @param {XmlNode} node
 * @param {ParsedDocx} docx
 * @param {NodeListHandler} nodeListHandler
 * @param {boolean} insideTrackChange
 * @returns {PmNodeJson[]}
 */
export const singleNodeTransform = (node, docx, nodeListHandler, insideTrackChange) => {
    const handleStandardNode = nodeListHandler.handlerEntities.find(e => e.handlerName === 'standardNodeHandler')?.handler;

    // Get the properties of the node - this is where we will find depth level for the node
    // As well as many other list properties
    const { attributes, elements, marks = [] } = parseProperties(node, docx, nodeListHandler, insideTrackChange);
    const {
        ilvl,
        numId
    } = getNumberingDefinitionsFromNode(attributes);
    const intLevel = parseInt(ilvl);

    const child = {
        type: 'paragraph',
        content: nodeListHandler.handler(elements, docx, insideTrackChange)?.filter(n => n)
    }

    const nodeAttributes = {
        numId,
        ilvl,
        intLevel,
        insideTrackChange: insideTrackChange,
        attributes: {
            parentAttributes: node?.attributes || null,
        }
    };

    return [createListItem([child], nodeAttributes, [])];
}

/**
 *
 * @param {PmNodeJson[]} pmNodes
 * @param {ParsedDocx} docx
 * @returns {PmNodeJson[]}
 */
export const listNodeAggregator = (pmNodes, docx) => {
    const result = []
    const windows = windowingSplit(pmNodes, (node) => node.type === 'listItem', (a, b) => a.attrs.numId === b.attrs.numId)
    for (let i = 0; i < windows.length; i++) {
        const window = windows[i];
        if (window.matched) {
            const list = handleListNodeList(window.list, docx, 0);
            result.push(list);
        } else {
            result.push(...window.list);
        }
    }
    return result;
}

/**
 *
 * @param {PmNodeJson[]} listItems
 * @param {ParsedDocx} docx
 * @param {number} listLevel
 * @returns {PmNodeJson}
 */
function handleListNodeList(listItems, docx, listLevel = 0) {
    const parsedListItems = [];
    let listStyleType;
    let overallListType;

    for (let [index, item] of listItems.entries()) {
        if(item.seen) continue;

        if (item.type !== 'listItem') {
            parsedListItems[parsedListItems.length - 1]?.content.push(item);
            continue;
        }

        const {
            listType,
            listOrderingType,
            listrPrs,
            listpPrs,
            start,
            lvlText,
            lvlJc
        } = getListDefinition(item.attrs.numId, listLevel, docx);
        listStyleType = listOrderingType;
        const intLevel = item.attrs.intLevel;

        // Append node if it belongs on this list level
        const nodeAttributes = {};
        if (listLevel === intLevel) {
            overallListType = listType;
            item.seen = true;

            item.attrs = {
                ...item.attrs,
                listrPrs,
                listpPrs,
                order: start,
                lvlText,
                lvlJc,
            }
            parsedListItems.push(item);
        } else if (listLevel < intLevel) {
            //we go into a deeper level so this is a sublist thing
            const sublist = handleListNodeList(listItems.slice(index), docx, listLevel + 1);
            const lastItem = parsedListItems[parsedListItems.length - 1];
            if (!lastItem) {
                parsedListItems.push(sublist);
            } else {
                lastItem.content.push(sublist);
            }
        } else {
            // we go into a higher level so it is time to break out
            break;
        }
    }
    return {
        type: overallListType || 'bulletList',
        content: parsedListItems,
        attrs: {
            'list-style-type': listStyleType,
        }
    };
}


/**
 *
 * @param {XmlNode} node
 * @param {boolean} isInsideList
 * @returns {boolean|*}
 */
export function testForList(node, isInsideList = false) {
    const { elements } = node;
    const pPr = elements?.find(el => el.name === 'w:pPr')
    if (!pPr) return false;

    const paragraphStyle = pPr.elements?.find(el => el.name === 'w:pStyle');
    const isList = paragraphStyle?.attributes['w:val'] === 'ListParagraph';
    const hasNumPr = pPr.elements?.find(el => el.name === 'w:numPr');
    return isList || hasNumPr;
}


/**
 * Creates a list item node with specified content and marks.
 *
 * @param {Array} content - The content of the list item.
 * @param {Array} marks - The marks associated with the list item.
 * @returns {Object} The created list item node.
 */
function createListItem(content, attrs, marks) {
    return {
        type: 'listItem',
        content,
        attrs,
        marks,
    };
}



const orderedListTypes = [
    "decimal", // eg: 1, 2, 3, 4, 5, ...
    "decimalZero", // eg: 01, 02, 03, 04, 05, ...
    "lowerRoman", // eg: i, ii, iii, iv, v, ...
    "upperRoman", // eg: I, II, III, IV, V, ...
    "lowerLetter", // eg: a, b, c, d, e, ...
    "upperLetter", // eg: A, B, C, D, E, ...
    "ordinal", // eg: 1st, 2nd, 3rd, 4th, 5th, ...
    "cardinalText", // eg: one, two, three, four, five, ...
    "ordinalText", // eg: first, second, third, fourth, fifth, ...
    "hex", // eg: 0, 1, 2, ..., 9, A, B, C, ..., F, 10, 11, ...
    "chicago", // eg: (0, 1, 2, ..., 9, 10, 11, 12, ..., 19, 1A, 1B, 1C, ..., 1Z, 20, 21, ..., 2Z)
];

const unorderedListTypes = [
    "bullet", // A standard bullet point (•)
    "square", // Square bullets (▪)
    "circle", // Circle bullets (◦)
    "disc", // Disc bullets (●)
]

function getNumberingDefinitionsFromNode(attributes) {
    if (!attributes) return;

    const { paragraphProperties } = attributes;
    const { elements: listStyles } = paragraphProperties;
    const numPr = listStyles.find(style => style.name === 'w:numPr');
    if (!numPr) {
        return {};
        throw new Error(`No numbering properties found in paragraph: ${JSON.stringify(attributes)}`);
    }

    // Get the indent level
    const ilvlTag = numPr.elements.find(style => style.name === 'w:ilvl');
    const ilvl = ilvlTag?.attributes['w:val'] ?? 0;

    // Get the list style id
    const numIdTag = numPr.elements.find(style => style.name === 'w:numId');
    const numId = numIdTag.attributes['w:val'];

    return { ilvl, numId };
}

/**
 *
 * @param {string} numId
 * @param {number} level
 * @param {ParsedDocx} docx
 * @returns {{lvlJc: *, listOrderingType: *, start: *, lvlText: *, listType: string, listpPrs: {}, listrPrs: {}}|{}}
 */
function getListDefinition(numId, level, docx) {
    const def = docx['word/numbering.xml'];
    if (!def) return {};

    const { elements } = def;
    const listData = elements[0];

    // Get the list styles
    const numberingElements = listData.elements;
    const abstractDefinitions = numberingElements.filter(style => style.name === 'w:abstractNum')
    const numDefinitions = numberingElements.filter(style => style.name === 'w:num')
    const numDefinition = numDefinitions.find(style => style.attributes['w:numId'] === numId);
    const abstractNumId = numDefinition?.elements[0].attributes['w:val']
    const listDefinitionForThisNumId = abstractDefinitions?.find(style => style.attributes['w:abstractNumId'] === abstractNumId);

    // Determine list type and formatting for this list level
    const currentLevel = getDefinitionForLevel(listDefinitionForThisNumId, level);
    if (!currentLevel) return {}

    const start = currentLevel.elements.find(style => style.name === 'w:start')?.attributes['w:val'];
    const listTypeDef = currentLevel.elements.find(style => style.name === 'w:numFmt').attributes['w:val'];
    const lvlText = currentLevel.elements.find(style => style.name === 'w:lvlText').attributes['w:val'];
    const lvlJc = currentLevel.elements.find(style => style.name === 'w:lvlJc').attributes['w:val'];

    // Properties - there can be run properties and paragraph properties
    const pPr = currentLevel.elements.find(style => style.name === 'w:pPr');
    let listpPrs, listrPrs;
    if (pPr) listpPrs = processListParagraphProperties(pPr);

    const rPr = currentLevel.elements.find(style => style.name === 'w:rPr');
    if (rPr) listrPrs = processListRunProperties(rPr);

    // Get style for this list level
    let listType;
    if (unorderedListTypes.includes(listTypeDef.toLowerCase())) listType = 'bulletList';
    else if (orderedListTypes.includes(listTypeDef)) listType = 'orderedList';
    else {
        throw new Error(`Unknown list type found during import: ${listTypeDef}`);
    }

    return { listType, listOrderingType: listTypeDef,  listrPrs, listpPrs, start, lvlText, lvlJc };
}

function getDefinitionForLevel(data, level) {
    return data?.elements?.find((item) => Number(item.attributes['w:ilvl']) === level);
}

function processListParagraphProperties(data) {
    const { elements } = data;
    const expectedTypes = ['w:ind', 'w:jc', 'w:tabs'];
    const paragraphProperties = {};
    if (!elements) return paragraphProperties;

    elements.forEach((item) => {
        if (!expectedTypes.includes(item.name)) throw new Error(`[numbering.xml] Unexpected list paragraph prop found: ${item.name}`);
        const { attributes = {} } = item;
        Object.keys(attributes).forEach(key => {
            paragraphProperties[key] = attributes[key];
        });
    });
    return paragraphProperties;
}

function processListRunProperties(data) {
    const { elements } = data;
    const expectedTypes = ['w:rFonts', 'w:b', 'w:bCs', 'w:i', 'w:iCs', 'w:strike', 'w:dstrike', 'w:color', 'w:sz', 'w:szCs', 'w:u', 'w:bdr', 'w:shd', 'w:vertAlign', 'w:jc', 'w:spacing', 'w:w', 'w:smallCaps'];
    const runProperties = {};
    if (!elements) return runProperties;

    elements.forEach((item) => {
        if (!expectedTypes.includes(item.name)) throw new Error(`[numbering.xml] Unexpected list run prop found: ${item.name}`);
        const { attributes = {} } = item;
        Object.keys(attributes).forEach(key => {
            runProperties[key] = attributes[key];
        });
    });
    return runProperties;
}

