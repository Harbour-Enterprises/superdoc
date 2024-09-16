import {handleStyleChangeMarks, parseMarks} from "./markImporter.js";
import {SuperConverter} from "../../SuperConverter.js";
import {TrackDeleteMarkName} from "../../../../extensions/track-changes/constants.js";
import {handleListNodes, testForList} from "./listImporter.js";
import {carbonCopy} from "../../../utilities/cabonCopy.js";


/**
 *
 * @param {XmlNode} node
 * @param {ParsedDocx} docx - The parsed docx object.
 * @param {NodeListHandler} nodeListHandler - The node list handler function.
 * @param {boolean} insideTrackChange - Whether we are inside a track change.
 * @param {number} [listLevel=0] - The current indentation level of the list.
 * @returns {{elements: *, attributes: {}, marks: *}}
 *
 */
export function parseProperties(node, docx, nodeListHandler, insideTrackChange, listLevel = 0) {
    /**
     * What does it mean for a node to have a properties element?
     * It would have a child element that is: w:pPr, w:rPr, w:sectPr
     */
    let marks = [];
    const { attributes = {}, elements = [] } = node;
    const { nodes, paragraphProperties = {}, runProperties = {} } = splitElementsAndProperties(elements);
    paragraphProperties.elements = paragraphProperties?.elements?.filter((el) => el.name !== 'w:rPr');

    // Get the marks from the run properties
    if (runProperties && runProperties?.elements?.length) marks = parseMarks(runProperties);
    if (paragraphProperties && paragraphProperties.elements?.length) {
        marks.push(...parseMarks(paragraphProperties));
        marks.push(...parseParagraphChange(node, paragraphProperties, docx, nodeListHandler, insideTrackChange, listLevel));
    }
    //add style change marks
    marks.push(...handleStyleChangeMarks(runProperties, marks));

    // Maintain any extra properties
    if (paragraphProperties && paragraphProperties.elements?.length) {
        attributes['paragraphProperties'] = paragraphProperties;
    }

    // If this is a paragraph, don't apply marks but apply attributes directly
    if (marks && node.name === 'w:p') {
        marks.forEach((mark) => {
            const keys = Object.keys(mark.attrs)
            if(keys.length > 0) {
                const attrValue = keys[0];
                const value = mark.attrs[attrValue];
                attributes[attrValue] = value;
            }
        });
        marks = [];
    }
    return { elements: nodes, attributes, marks }
}

/**
 *
 * @param {XmlNode} node
 * @param {XmlNode} paragraphProperties
 * @param {ParsedDocx} docx - The parsed docx object.
 * @param {NodeListHandler} nodeListHandler - The node list handler function.
 * @param {boolean} insideTrackChange - Whether we are inside a track change.
 * @param {number} [listLevel=0] - The current indentation level of the list.
 */
function parseParagraphChange(node, paragraphProperties, docx, nodeListHandler, insideTrackChange, listLevel=0) {
    const changes = [];
    const changeElements = paragraphProperties.elements.filter((el) => el.name === 'w:pPrChange');

    changeElements.forEach((changeElement) => {
        const changeProps = changeElement.elements.find((el) => el.name === 'w:pPr');
        const mappedAttributes = {
            wid: changeElement.attributes['w:id'],
            date: changeElement.attributes['w:date'],
            author: changeElement.attributes['w:author'],
        }
        const marks = [];
        if (changeProps) {
            const { attributes } = changeProps;
            marks.push(...parseMarks(changeProps));
            if(marks.length > 0) {
                marks.forEach((mark) => {
                    const keys = Object.keys(mark.attrs)
                    if(keys.length > 0) {
                        const attrValue = keys[0];
                        const value = mark.attrs[attrValue];
                        //attributes[attrValue] = value;
                    }
                });
            }
            const copiedElements = carbonCopy(node.elements);
            const newElements = copiedElements.filter((el) => el.name !== 'w:pPr');
            newElements.push(changeProps)
            const nodeWithChange = {
                type: node.type,
                name: node.name,
                attributes: carbonCopy(node.attributes),
                elements: newElements,
            }
            if (testForList(nodeWithChange)) {
                const listNode = handleListNodes([nodeWithChange], docx, nodeListHandler, insideTrackChange, listLevel);
                const wrappers = []
                const listParent = {
                    type: listNode.type,
                    attrs: listNode.attrs
                }
                wrappers.push(listParent);
                const children = listNode.content;
                if(children.length === 1) {
                    const listItem = {
                        type: children[0].type,
                        attrs: children[0].attrs
                    }
                    wrappers.push(listItem);
                }
                changes.push({
                    attrs: {
                        track: [{
                            type: TrackDeleteMarkName,
                            author: mappedAttributes.author,
                            date: mappedAttributes.date,
                            wid: mappedAttributes.wid,
                            before: {
                                wrappers
                            }
                        }]
                    }
                })
            }
        }
    });

    return changes;
}

/**
 *
 * @param {XmlNode[]} elements
 * @returns {{nodes: *, runProperties: *, sectionProperties: *, paragraphProperties: *}}
 */
function splitElementsAndProperties(elements) {
    const pPr = elements.find((el) => el.name === 'w:pPr');
    const rPr = elements.find((el) => el.name === 'w:rPr');
    const sectPr = elements.find((el) => el.name === 'w:sectPr');
    const els = elements.filter((el) => el.name !== 'w:pPr' && el.name !== 'w:rPr' && el.name !== 'w:sectPr');

    return {
        nodes: els,
        paragraphProperties: pPr,
        runProperties: rPr,
        sectionProperties: sectPr,
    }
}

/**
 *
 * @param {XmlNode} element
 * @returns {*}
 */
export function getElementName(element) {
    return SuperConverter.allowedElements[element.name || element.type];
}


/**
 *
 * @param {XmlNode[]} elements
 * @returns {*}
 */
export function hasTextNode(elements) {
    const runs = elements.filter((el) => el.name === 'w:r');
    const runsHaveText = runs.some((run) => run.elements.some((el) => el.name === 'w:t'));
    return runsHaveText;
}