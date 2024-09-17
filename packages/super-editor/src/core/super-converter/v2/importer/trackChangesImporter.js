import {TrackDeleteMarkName, TrackInsertMarkName} from "../../../../extensions/track-changes/constants.js";
import {parseProperties, splitElementsAndProperties} from "./importerHelpers.js";
import {parseMarks} from "./markImporter.js";
import {carbonCopy} from "../../../utilities/cabonCopy.js";
import {handleListNodes, testForList} from "./listImporter.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleTrackChangeNode = (nodes, docx, nodeListHandler, insideTrackChange = false) => {
    if(nodes.length === 0 || !(nodes[0].name === 'w:del' || nodes[0].name === 'w:ins')) {
        return [];
    }
    const node = nodes[0];
    const { name } = node;
    const { attributes, elements } = parseProperties(node, docx, nodeListHandler, insideTrackChange);

    const subs = nodeListHandler.handler(elements, docx,true)
    const changeType = name === 'w:del' ? TrackDeleteMarkName : TrackInsertMarkName;
    const mappedAttributes = {
        wid: attributes['w:id'],
        date: attributes['w:date'],
        author: attributes['w:author'],
    }

    subs.forEach(subElement => {
        if(subElement.marks === undefined) subElement.marks = [];
        subElement.marks.push({ type: changeType, attrs: mappedAttributes });
    });

    return subs;
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const trackChangeNodeHandlerEntity = {
    handlerName: 'trackChangeNodeHandler',
    handler: handleTrackChangeNode
};

/**
 *
 * @param {XmlNode} xmlNode
 * @param {PmNodeJson} parsedPmNode
 * @param {ParsedDocx} docx - The parsed docx object.
 * @param {NodeListHandler} nodeListHandler - The node list handler function.
 * @param {boolean} insideTrackChange - Whether we are inside a track change.
 * @param {number} [listLevel=0] - The current indentation level of the list.
 */
export function handleParagraphNodeChange(xmlNode, parsedPmNode, docx, nodeListHandler) {
    const { attributes = {}, elements = [] } = xmlNode;
    const { nodes, paragraphProperties = {}, runProperties = {} } = splitElementsAndProperties(elements);
    paragraphProperties.elements = paragraphProperties?.elements?.filter((el) => el.name !== 'w:rPr');

    if(!paragraphProperties || !paragraphProperties.elements || !paragraphProperties.elements.length) {
        return {};
    }


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
            const copiedElements = carbonCopy(xmlNode.elements);
            const newElements = copiedElements.filter((el) => el.name !== 'w:pPr');
            newElements.push(changeProps)
            const nodeWithChange = {
                type: xmlNode.type,
                name: xmlNode.name,
                attributes: carbonCopy(xmlNode.attributes),
                elements: newElements,
            }
            const res = nodeListHandler.handler([nodeWithChange], docx, false)
            if(res.length > 0) {
                //TODO: here we should diff the old node and a new node, and add the attributes
                console.log(parsedPmNode);
                console.log(res)
            }
        }
    });

    return changes;
}
