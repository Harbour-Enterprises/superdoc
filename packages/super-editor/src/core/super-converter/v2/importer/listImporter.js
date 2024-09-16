import {carbonCopy} from "../../../utilities/cabonCopy.js";
import {hasTextNode, parseProperties} from "./importerHelpers.js";
import {preProcessNodesForFldChar} from "./paragraphNodeImporter.js";
import {TrackChangeBlockChangeAttributeName} from "../../../../extensions/track-changes/constants.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleListNode = (nodes, docx, nodeListHandler, insideTrackChange)  => {
    if(nodes.length === 0 || nodes[0].name !== 'w:p') {
        return {nodes: [], consumed: 0};
    }
    const node = carbonCopy(nodes[0])

    let schemaNode;

    // We need to pre-process paragraph nodes to combine various possible elements we will find ie: lists, links.
    const processedElements = preProcessNodesForFldChar(node.elements);
    node.elements = processedElements;

    // Check if this paragraph node is a list
    if (testForList(node)) {
        // Get all siblings that are list items and haven't been processed yet.
        const siblings = carbonCopy(nodes);
        const listItems = [];
        let consumed = 0;

        // Iterate each item until we find the end of the list (a non-list item),
        // then send to the list handler for processing.
        let possibleList = siblings.shift();
        while (possibleList && testForList(possibleList, true)) {
            listItems.push(possibleList);
            possibleList = siblings.shift();
            if (possibleList?.elements && !hasTextNode(possibleList.elements)) {
                listItems.push(possibleList);
                possibleList = siblings.shift();
            }
        }

        // TODO - Check that this change is OK
        return {
            nodes: [handleListNodes(listItems, docx, nodeListHandler, 0)],
            consumed: listItems.filter(i => i.seen).length
        };
    } else {
        return {nodes: [], consumed: 0};
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
 * List processing
 *
 * This recursive function takes a list of known list items and combines them into nested lists.
 *
 * It begins with listLevel = 0, and if we find an indented node, we call this function again and increase the level.
 * with the same set of list items (as we do not know the node levels until we process them).
 *
 * @param {Array} listItems - Array of list items to process.
 * @param {ParsedDocx} docx - The parsed docx object.
 * @param {NodeListHandler} nodeListHandler - The node list handler function.
 * @param {boolean} insideTrackChange - Whether we are inside a track change.
 * @param {number} [listLevel=0] - The current indentation level of the list.
 * @returns {Object} The processed list node with structured content.
 */
export function handleListNodes(listItems, docx, nodeListHandler, insideTrackChange, listLevel = 0) {
    const parsedListItems = [];
    let overallListType;
    let listStyleType;

    const handleStandardNode = nodeListHandler.handlerEntities.find(e => e.handlerName === 'standardNodeHandler')?.handler;
    if (!handleStandardNode) {
        console.error('Standard node handler not found');
        return {nodes: [], consumed: 0};
    }

    for (let [index, item] of listItems.entries()) {
        // Skip items we've already processed
        if (item.seen) continue;

        // Sometimes there are paragraph nodes that only have pPr element and no text node - these are
        // Spacers in the XML and need to be appended to the last item.
        if (item.elements && !hasTextNode(item.elements)) {
            const n = handleStandardNode([item], docx, nodeListHandler, insideTrackChange).nodes[0];
            parsedListItems[parsedListItems.length - 1]?.content.push(n);
            item.seen = true;
            continue;
        }

        // Get the properties of the node - this is where we will find depth level for the node
        // As well as many other list properties
        const { attributes, elements, marks = [] } = parseProperties(item, docx, nodeListHandler, insideTrackChange, listLevel);
        const {
            listType,
            listOrderingType,
            ilvl,
            listrPrs,
            listpPrs,
            start,
            lvlText,
            lvlJc
        } = getNodeNumberingDefinition(attributes, listLevel, docx);
        listStyleType = listOrderingType;
        const intLevel = parseInt(ilvl);

        // Append node if it belongs on this list level
        const nodeAttributes = {};
        if (listLevel === intLevel) {
            overallListType = listType;
            item.seen = true;

            const schemaElements = [];
            schemaElements.push({
                type: 'paragraph',
                content: nodeListHandler.handler(elements, docx, insideTrackChange)?.filter(n => n)
            });

            console.debug('\n\n LIST ITEM', listpPrs, listrPrs, start, lvlText, lvlJc, '\n\n')

            if (listpPrs) nodeAttributes['listParagraphProperties'] = listpPrs;
            if (listrPrs) nodeAttributes['listRunProperties'] = listrPrs;
            nodeAttributes['order'] = start;
            nodeAttributes['lvlText'] = lvlText;
            nodeAttributes['lvlJc'] = lvlJc;
            nodeAttributes['attributes'] = {
                parentAttributes: item?.attributes || null,
            }
            parsedListItems.push(createListItem(schemaElements, nodeAttributes, []));
        }

            // If this item belongs in a deeper list level, we need to process it by calling this function again
        // But going one level deeper.
        else if (listLevel < intLevel) {
            const sublist = handleListNodes(listItems.slice(index), docx, nodeListHandler, insideTrackChange, listLevel + 1);
            const lastItem = parsedListItems[parsedListItems.length - 1];
            if (!lastItem) {
                parsedListItems.push(createListItem([sublist], nodeAttributes, []));
            } else {
                lastItem.content.push(sublist);
            }
        }

        // If this item belongs in a higher list level, we need to break out of the loop and return to higher levels
        else break;
    }
    const track = []
    if((listItems[0]?.attributes.track ?? []).length > 0) {
        const trackOnLi = listItems[0].attributes.track[0]
        if(trackOnLi.before.wrappers.length > 0) {
            const firstWrapper = trackOnLi.before.wrappers[0];
            const secondWrapper = trackOnLi.before.wrappers[1];
            if(secondWrapper.type === 'listItem') {
                track.push({
                    type: TrackChangeBlockChangeAttributeName,
                    author: trackOnLi.author,
                    date: trackOnLi.date,
                    wid: trackOnLi.wid,
                    before: {
                      type: firstWrapper.type,
                      attrs: firstWrapper.attrs
                    }
                })
                parsedListItems[0].attrs.track = [{
                    type: TrackChangeBlockChangeAttributeName,
                    author: trackOnLi.author,
                    date: trackOnLi.date,
                    wid: trackOnLi.wid,
                    before: {
                        type: secondWrapper.type,
                        attrs: secondWrapper.attrs
                    }
                }]
            }
        }


    }

    return {
        type: overallListType || 'bulletList',
        content: parsedListItems,
        attrs: {
            'list-style-type': listStyleType,
            attributes: {
                'parentAttributes': listItems[0]?.attributes || null,
            },
            track: track,
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

/**
 * Main function to get list item information from numbering.xml
 *
 * @param {object} attributes
 * @param {int} level
 * @param {ParsedDocx} docx
 * @returns
 */
function getNodeNumberingDefinition(attributes, level, docx) {
    if (!attributes) return;

    const def = docx['word/numbering.xml'];
    if (!def) return {};

    const { elements } = def;
    const listData = elements[0];

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
    if (pPr) listpPrs = _processListParagraphProperties(pPr);

    const rPr = currentLevel.elements.find(style => style.name === 'w:rPr');
    if (rPr) listrPrs = _processListRunProperties(rPr);

    // Get style for this list level
    let listType;
    if (unorderedListTypes.includes(listTypeDef.toLowerCase())) listType = 'bulletList';
    else if (orderedListTypes.includes(listTypeDef)) listType = 'orderedList';
    else {
        throw new Error(`Unknown list type found during import: ${listTypeDef}`);
    }

    return { listType, listOrderingType: listTypeDef,  ilvl, numId, listrPrs, listpPrs, start, lvlText, lvlJc };
}

function getDefinitionForLevel(data, level) {
    return data?.elements?.find((item) => Number(item.attributes['w:ilvl']) === level);
}

function _processListParagraphProperties(data) {
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

function _processListRunProperties(data) {
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

