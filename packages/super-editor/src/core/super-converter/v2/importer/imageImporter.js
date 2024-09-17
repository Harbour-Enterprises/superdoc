import {emuToPixels} from "../../helpers.js";

/**
 * @type {import("docxImporter").NodeHandler}
 */
export const handleDrawingNode= (nodes, docx, nodeListHandler, insideTrackChange)  => {
    if(nodes.length === 0 || nodes[0].name !== 'w:drawing') {
        return [];
    }
    const node = nodes[0];

    let result;
    const { elements } = node;

    // Inline images
    const inlineImage = elements.find((el) => el.name === 'wp:inline');
    if (inlineImage) result = handleInlineImageNode(inlineImage, docx);
    return result ? [result] : [];
}

export function handleInlineImageNode(node, docx) {
    const { attributes } = node;
    const padding = {
        top: emuToPixels(attributes['distT']),
        bottom: emuToPixels(attributes['distB']),
        left: emuToPixels(attributes['distL']),
        right: emuToPixels(attributes['distR']),
    };

    const extent = node.elements.find((el) => el.name === 'wp:extent');
    const size = {
        width: emuToPixels(extent.attributes['cx']),
        height: emuToPixels(extent.attributes['cy'])
    }

    // TODO: Do we need this?
    const effectExtent = node.elements.find((el) => el.name === 'wp:effectExtent');

    const graphic = node.elements.find((el) => el.name === 'a:graphic');
    const graphicData = graphic.elements.find((el) => el.name === 'a:graphicData');

    const picture = graphicData.elements.find((el) => el.name === 'pic:pic');
    const blipFill = picture.elements.find((el) => el.name === 'pic:blipFill');
    const blip = blipFill.elements.find((el) => el.name === 'a:blip');
    const { attributes: blipAttributes } = blip;
    const rEmbed = blipAttributes['r:embed'];
    const print = blipAttributes['r:print'];

    const rels = docx['word/_rels/document.xml.rels'];
    const relationships = rels.elements.find((el) => el.name === 'Relationships');
    const { elements } = relationships;

    const rel = elements.find((el) => el.attributes['Id'] === rEmbed);
    const { attributes: relAttributes } = rel;
    const media = docx.media;
    const path = `word/${relAttributes['Target']}`;

    return {
        type: 'image',
        attrs: {
            src: media[path],
            alt: 'Image',
            title: 'Image',
            inline: true,
            padding,
            size,
        }
    }
}

/**
 * @type {import("docxImporter").NodeHandlerEntry}
 */
export const drawingNodeHandlerEntity = {
    handlerName: 'drawingNodeHandler',
    handler: handleDrawingNode
};