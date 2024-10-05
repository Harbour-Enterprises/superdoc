import { SuperConverter } from './SuperConverter';
import { twipsToPixels, twipsToInches, halfPointToPixels, emuToPixels, halfPointToPoints } from './helpers.js';
import {
  TrackDeleteMarkName,
  TrackInsertMarkName,
  TrackMarksMarkName
} from "../../extensions/track-changes/constants.js";


/**
 * The DocxImporter class is responsible for converting a JSON representation of a DOCX file.
 * It depends on SuperConverter and its xml converted data to build the schema.
 *
 * Calling getSchema() will return a ProseMirror schema object.
 */
export class DocxImporter {

  constructor(converter) {
    this.converter = converter;
    this.currentFileName = null;
  }

  getSchema() {
    const json = JSON.parse(JSON.stringify(this.converter.initialJSON));
    if (!json) return null;

    console.debug('\n\n JSON', json,)
    const result = {
      type: 'doc',
      content: this.#convertToSchema(json.elements[0].elements),
      attrs: {
        attributes: json.elements[0].attributes,
      }
    }
    return result;
  }

  #getElementName(element) {
    return SuperConverter.allowedElements[element.name || element.type];
  }

  /**
   * Process a list of JSON elements and convert them to ProseMirror nodes.
   *
   * @param {list} elements
   * @param {boolean} insideTrackChange - If we are inside a track change node.
   * @returns
   */
  #convertToSchema(elements, insideTrackChange = false) {
    // console.debug('\nConvert to schema:', elements,'\n')
    if (!elements || !elements.length) return;

    const processedElements = [];
    for (let index = 0; index < elements.length; index++) {
      const node = elements[index];
      if (node.seen) continue;

      // We will build a prose mirror ready schema node from XML node
      let schemaNode;
      switch (node.name) {
        case 'w:body':
          return this.#handleBodyNode(node);
        case 'w:r':
          processedElements.push(...this.#handleRunNode(node, insideTrackChange));
          continue;
        case 'w:p':
          schemaNode = this.#handleParagraphNode(node, elements, index);
          break;
        case 'w:t':
          schemaNode = this.#handleTextNode(node);
          break;
        case 'w:tab':
          schemaNode = this.#handleStandardNode(node);
          schemaNode.content = [{ type: 'text', text: ' ' }];
          break;
        case 'w:hyperlink':
          schemaNode = this.#handleHyperlinkNode(node);
          break;
        case 'w:commentRangeStart':
          schemaNode = this.#handleStandardNode(node);
          break;
        case 'w:commentRangeStart':
          schemaNode = this.#handleStandardNode(node);
          break;
        case 'w:tbl':
          schemaNode = this.#handleTableNode(node);
          break;
        case 'w:tr':
          // Table rows are processed from inside the table node
          return [];
        case 'w:tc':
          // Table cells are processed from inside the table row node
          return [];
        case 'w:drawing':
          schemaNode = this.#handleDrawingNode(node);
          break;
        case 'w:bookmarkStart':
          schemaNode = this.#handleBookmarkNode(node);
          break;
        case 'w:br':
          schemaNode = this.#handleLineBreakNode(node);
          break;
        case 'w:del':
        case 'w:ins':
          schemaNode = this.#handleTrackChangeNode(node);
          break;
        case 'w:delText':
          schemaNode = this.#handleDelText(node, insideTrackChange);
          break;
        case 'w:sdt':
          schemaNode = this.#handleFieldAnnotationNode(node);
          break;
        default:
          schemaNode = this.#handleStandardNode(node);
      }

      if(!Array.isArray(schemaNode)) {
        schemaNode = [schemaNode]
      }

      for(let node of schemaNode) {
        if (node?.type) {
          const ignore = ['runProperties'];
          if (!ignore.includes(node.type)) processedElements.push(node);
        }
      }
    }
    return processedElements;
  }

  #handleLineBreakNode(node) {
    const attrs = {};
    
    const { attrs: nodeAttrs = {} } = node;
    const lineBreakType = nodeAttrs['w:type'];
    if (lineBreakType) attrs['lineBreakType'] = lineBreakType;

    return {
      type: 'lineBreak',
      attrs,
      content: [],
    }
  }

  #handleBookmarkNode(node) {
    const newNode = this.#handleStandardNode(node);
    const { attrs = {} } = newNode;
    newNode.attrs.name = attrs['w:name'];
    return newNode;
  }

  #handleDrawingNode(node) {
    let result;
    const { elements } = node;

    // Some images are identified by wp:anchor
    const isAnchor = elements.find((el) => el.name === 'wp:anchor');
    if (isAnchor) result = this.#handleImageImport(elements[0]);

    // Others, wp:inline
    const inlineImage = elements.find((el) => el.name === 'wp:inline');
    if (inlineImage) result = this.#handleImageImport(inlineImage);
    return result;
  }

  #handleImageImport(node) {

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

    const graphic = node.elements.find((el) => el.name === 'a:graphic');
    const graphicData = graphic.elements.find((el) => el.name === 'a:graphicData');

    const picture = graphicData.elements.find((el) => el.name === 'pic:pic');
    const blipFill = picture.elements.find((el) => el.name === 'pic:blipFill');
    const blip = blipFill.elements.find((el) => el.name === 'a:blip');

    const positionHTag = node.elements.find((el) => el.name === 'wp:positionH');
    const positionH = positionHTag?.elements.find((el) => el.name === 'wp:posOffset')
    const positionHValue = emuToPixels(positionH?.elements[0]?.text);

    const positionVTag = node.elements.find((el) => el.name === 'wp:positionV');
    const positionV = positionVTag?.elements.find((el) => el.name === 'wp:posOffset')
    const positionVValue = emuToPixels(positionV?.elements[0]?.text);

    const marginOffset = {
      left: positionHValue,
      top: positionVValue,
    }
  
    const { attributes: blipAttributes } = blip;
    const rEmbed = blipAttributes['r:embed'];
    const currentFile = this.currentFileName || 'document.xml';
    let rels = this.converter.convertedXml[`word/_rels/${currentFile}.rels`];
    if (!rels) rels = this.converter.convertedXml[`word/_rels/document.xml.rels`];

    const relationships = rels.elements.find((el) => el.name === 'Relationships');
    const { elements } = relationships;

    const rel = elements.find((el) => el.attributes['Id'] === rEmbed);
    const { attributes: relAttributes } = rel;

    const path = `word/${relAttributes['Target']}`;

    return {
      type: 'image',
      attrs: {
        src: path,
        alt: 'Image',
        inline: true,
        padding,
        marginOffset,
        size,
      }
    }
  }

  #handleTableCellNode(node, styleTag) {
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

    const verticalAlignTag = tcPr?.elements?.find((el) => el.name === 'w:vAlign');
    const verticalAlign = verticalAlignTag?.attributes['w:val'];

    const attributes = {};
    const referencedStyles = this.#getReferencedTableStyles(styleTag) || {};
    attributes.cellMargins = this.#getTableCellMargins(marginTag, referencedStyles);

    const { fontSize, fonts = {} } = referencedStyles;
    const fontFamily = fonts['ascii'];
  
    if (width) attributes['width'] = width;
    if (widthType) attributes['widthType'] = widthType;
    if (colspan) attributes['colspan'] = colspan;
    if (background) attributes['background'] = background;
    if (verticalAlign) attributes['verticalAlign'] = verticalAlign;
    if (fontSize) attributes['fontSize'] = fontSize;
    if (fontFamily) attributes['fontFamily'] = fontFamily['ascii'];

    return {
      type: 'tableCell',
      content: this.#convertToSchema(node.elements),
      attrs: attributes,
    }
  }

  #getTableCellMargins(marginTag, referencedStyles) {
    const inlineMarginLeftTag = marginTag?.elements?.find((el) => el.name === 'w:left');
    const inlineMarginRightTag = marginTag?.elements?.find((el) => el.name === 'w:right');
    const inlineMarginTopTag = marginTag?.elements?.find((el) => el.name === 'w:top');
    const inlineMarginBottomTag = marginTag?.elements?.find((el) => el.name === 'w:bottom');

    const inlineMarginLeftValue = twipsToPixels(inlineMarginLeftTag?.attributes['w:w']);
    const inlineMarginRightValue = twipsToPixels(inlineMarginRightTag?.attributes['w:w']);
    const inlineMarginTopValue = twipsToPixels(inlineMarginTopTag?.attributes['w:w']);
    const inlineMarginBottomValue = twipsToPixels(inlineMarginBottomTag?.attributes['w:w']);

    const { cellMargins = {} } = referencedStyles;
    const {
      marginLeft: marginLeftStyle,
      marginRight: marginRightStyle,
      marginTop: marginTopStyle,
      marginBottom: marginBottomStyle
    } = cellMargins;

    const margins = {
      left: twipsToPixels(inlineMarginLeftValue ?? marginLeftStyle),
      right: twipsToPixels(inlineMarginRightValue ?? marginRightStyle),
      top: twipsToPixels(inlineMarginTopValue ?? marginTopStyle),
      bottom: twipsToPixels(inlineMarginBottomValue ?? marginBottomStyle),
    };
    return margins;
  }

  #getReferencedTableStyles(tblStyleTag) {
    if (!tblStyleTag) return null;

    const stylesToReturn = {};
    const { attributes } = tblStyleTag;
    const tableStyleReference = attributes['w:val'];
    if (!tableStyleReference) return null;

    const styles = this.converter.convertedXml['word/styles.xml'];
    const { elements } = styles.elements[0];
    const styleElements = elements.filter((el) => el.name === 'w:style');
    const styleTag = styleElements.find((el) => el.attributes['w:styleId'] === tableStyleReference);
    if (!styleTag) return null;

    stylesToReturn.name = styleTag.elements.find((el) => el.name === 'w:name');

    // TODO: Do we need this?
    const basedOn = styleTag.elements.find((el) => el.name === 'w:basedOn');
    const uiPriotity = styleTag.elements.find((el) => el.name === 'w:uiPriority');
    
    const pPr = styleTag.elements.find((el) => el.name === 'w:pPr');
    if (pPr) {
      const justification = pPr.elements.find((el) => el.name === 'w:jc');
      if (justification) stylesToReturn.justification = justification.attributes['w:val'];
    }

    const rPr = styleTag?.elements.find((el) => el.name === 'w:rPr');
    if (rPr) {
      const fonts = rPr.elements.find((el) => el.name === 'w:rFonts');
      if (fonts) {
        const { 'w:ascii': ascii, 'w:hAnsi': hAnsi, 'w:cs': cs } = fonts.attributes;
        stylesToReturn.fonts = { ascii, hAnsi, cs };
      }

      const fontSize = rPr.elements.find((el) => el.name === 'w:sz');
      if (fontSize) stylesToReturn.fontSize = halfPointToPoints(fontSize.attributes['w:val']) + 'pt';
    }

    const tblPr = styleTag.elements.find((el) => el.name === 'w:tblPr');
    if (tblPr) {
      const tableBorders = tblPr?.elements.find((el) => el.name === 'w:tblBorders');
      const { elements: borderElements = [] } = tableBorders || {};
      const { borders, rowBorders } = this.#processTableBorders(borderElements);
      if (borders) stylesToReturn.borders = borders;
      if (rowBorders) stylesToReturn.rowBorders = rowBorders;

      const tableCellMargin = tblPr?.elements.find((el) => el.name === 'w:tblCellMar');
      if (tableCellMargin) {
        const marginLeft = tableCellMargin.elements.find((el) => el.name === 'w:left');
        const marginRight = tableCellMargin.elements.find((el) => el.name === 'w:right');
        const marginTop = tableCellMargin.elements.find((el) => el.name === 'w:top');
        const marginBottom = tableCellMargin.elements.find((el) => el.name === 'w:bottom');
        stylesToReturn.cellMargins = {
          marginLeft: marginLeft?.attributes['w:w'],
          marginRight: marginRight?.attributes['w:w'],
          marginTop: marginTop?.attributes['w:w'],
          marginBottom: marginBottom?.attributes['w:w'],
        }
      }
    }

    return stylesToReturn;
  }

  #processTableBorders(borderElements) {
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

  #handleTableRowNode(node, rowBorders, styleTag) {
    const attrs = {};

    const tPr = node.elements.find((el) => el.name === 'w:trPr');
    const rowHeightTag = tPr?.elements.find((el) => el.name === 'w:trHeight');
    const rowHeight = rowHeightTag?.attributes['w:val'];
    const rowHeightRule = rowHeightTag?.attributes['w:hRule'];

    const borders = {};
    if (rowBorders?.insideH) borders['bottom'] = rowBorders.insideH;
    if (rowBorders?.insideV) borders['right'] = rowBorders.insideV;
    attrs['borders'] = borders;

    if (rowHeight) {
      attrs['rowHeight'] = twipsToPixels(rowHeight);
    }

    const cellNodes = node.elements.filter((el) => el.name === 'w:tc');
    const content = cellNodes?.map((n) => this.#handleTableCellNode(n, styleTag)) || [];
    const newNode = {
      type: 'tableRow',
      content,
      attrs,
    }
    return newNode;
  }

  #handleTableNode(node) {
    // Table styles
    const tblPr = node.elements.find((el) => el.name === 'w:tblPr');

    // Table borders can be specified in tblPr or inside a referenced style tag
    const tableBordersElement = tblPr.elements.find((el) => el.name === 'w:tblBorders');
    const tableBorders = tableBordersElement?.elements || [];
    const { borders, rowBorders } = this.#processTableBorders(tableBorders);
    const tblStyleTag = tblPr.elements.find((el) => el.name === 'w:tblStyle');
    const tableStyleId = tblStyleTag?.attributes['w:val'];

    const attrs = { tableStyleId };
  
    // Other table properties
    const tableIndent = tblPr?.elements.find((el) => el.name === 'w:tblInd');
    if (tableIndent) {
      const { 'w:w': width, 'w:type': type } = tableIndent.attributes;
      attrs['tableIndent'] = { width: twipsToPixels(width), type };
    }

    const tableLayout = tblPr?.elements.find((el) => el.name === 'w:tblLayout');
    if (tableLayout) {
      const { 'w:type': type } = tableLayout.attributes;
      attrs['tableLayout'] = type;
    }

    const referencedStyles = this.#getReferencedTableStyles(tblStyleTag);
    const tblW = tblPr.elements.find((el) => el.name === 'w:tblW');
    if (tblW) {
      attrs['tableWidth'] = {
        width: twipsToPixels(tblW.attributes['w:w']),
        type: tblW.attributes['w:type'],
      }
    }
    
    // TODO: What does this do?
    // const tblLook = tblPr.elements.find((el) => el.name === 'w:tblLook');
    const tblGrid = node.elements.find((el) => el.name === 'w:tblGrid');
    const gridColumnWidths = tblGrid.elements.map((el) => twipsToInches(el.attributes['w:w']));
    if (gridColumnWidths) attrs['gridColumnWidths'] = gridColumnWidths;

    const rows = node.elements.filter((el) => el.name === 'w:tr');

    const borderData = Object.keys(borders)?.length ? borders : referencedStyles.borders;
    const borderRowData = Object.keys(rowBorders)?.length ? rowBorders : referencedStyles.rowBorders;
    attrs['borders'] = borderData;

    const content = rows.map((row) => this.#handleTableRowNode(row, borderRowData, tblStyleTag));

    return {
      type: 'table',
      content,
      attrs,
    }
  }

  #handleHyperlinkNode(node) {
    const rels = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const relationships = rels.elements.find((el) => el.name === 'Relationships');
    const { elements } = relationships;

    const { attributes } = node;
    const rId = attributes['r:id'];
    const anchor = attributes['w:anchor'];

    // TODO: Check if we need this atr
    const history = attributes['w:history'];

    const rel = elements.find((el) => el.attributes['Id'] === rId) || {};
    const { attributes: relAttributes = {} } = rel;
    let href = relAttributes['Target'];

    if (anchor && !href) href = `#${anchor}`;

    // Add marks to the run node and process it
    const runNode = node.elements.find((el) => el.name === 'w:r');
    const linkMark = { type: 'link', attrs: { href } };

    if (!runNode.marks) runNode.marks = [];
    runNode.marks.push(linkMark);

    const rPr = runNode.elements.find((el) => el.name === 'w:rPr');
    if (rPr) {
      const styleRel = rPr.elements.find((el) => el.name === 'w:rStyle');
      if (styleRel) {
        const styles = this.converter.convertedXml['word/styles.xml'];
        const { elements } = styles.elements[0];

        const styleElements = elements.filter((el) => el.name === 'w:style');
        const style = styleElements.find((el) => el.attributes['w:styleId'] === 'Hyperlink');
        const styleRpr = style.elements.find((el) => el.name === 'w:rPr');
        if (styleRpr) runNode.elements.unshift(styleRpr);
      }
    }

    const updatedNode = this.#convertToSchema([runNode])[0];
    return updatedNode
  }

  /**
   *
   * @param {{type: string, attrs: {}}[]} marks
   * @returns {{type: string, attrs: {}}[]}
   */
  #createImportMarks(marks) {
    const textStyleMarksToCombine = marks.filter((mark) => mark.type === 'textStyle');
    const remainingMarks = marks.filter((mark) => mark.type !== 'textStyle');

    // Combine text style marks
    const combinedTextAttrs = {};
    if (textStyleMarksToCombine.length) {
      textStyleMarksToCombine.forEach((mark) => {
        const { attrs } = mark;

        Object.keys(attrs).forEach((attr) => {
          combinedTextAttrs[attr] = attrs[attr];
        });
      });
    };

    const result = [...remainingMarks, { type: 'textStyle', attrs: combinedTextAttrs }];
    return result;
  }

  #handleStandardNode(node) {
    // Parse properties
    const { name, type } = node;
    const { attributes, elements, marks = [] } = this.#parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
      const updatedElements = elements.map((el) => {
        if (!el.marks) el.marks = [];
        el.marks.push(...marks);
        return el;
      })
      content.push(...this.#convertToSchema(updatedElements));
    }

    return {
      type: this.#getElementName(node),
      content,
      attrs: { ...attributes },
      marks: [],
    };
  }

  #handleBodyNode(node) {
    this.converter.savedTagsToRestore.push({ ...node });
    const ignoreNodes = ['w:sectPr'];
    const content = node.elements.filter((n) => !ignoreNodes.includes(n.name));

    this.converter.pageStyles = this.#getDocumentStyles(node);
    return this.#convertToSchema(content);
  }

  #handleRunNode(node, insideTrackChange = false) {
    let processedRun = this.#convertToSchema(node.elements, insideTrackChange)?.filter(n => n) || [];
    const hasRunProperties = node.elements.some(el => el.name === 'w:rPr');
    if (hasRunProperties) {
      const { marks = [], attributes = {} } = this.#parseProperties(node);
      if (node.marks) marks.push(...node.marks);
      processedRun = processedRun.map(n => ({ ...n, marks, attributes }));
    }
    return processedRun;
  }

  /**
   * Special cases of w:p based on paragraph properties
   *
   * If we detect a list node, we need to get all nodes that are also lists and process them together
   * in order to combine list item nodes into list nodes.
   */
  #handleParagraphNode(node, elements, index) {
    let schemaNode;

    // We need to pre-process paragraph nodes to combine various possible elements we will find ie: lists, links.
    const processedElements = this.#preProcessNodesForFldChar(node.elements);
    node.elements = processedElements;

    // Check if this paragraph node is a list
    if (this.#testForList(node)) {
      // Get all siblings that are list items and haven't been processed yet.
      const siblings = [...elements.slice(index)];
      const listItems = [];

      // Iterate each item until we find the end of the list (a non-list item),
      // then send to the list handler for processing.
      let possibleList = siblings.shift();
      while (possibleList && this.#testForList(possibleList, true)) {
        listItems.push(possibleList);
        possibleList = siblings.shift();
        if (possibleList?.elements && !this.#hasTextNode(possibleList.elements)) {
          listItems.push(possibleList);
          possibleList = siblings.shift();
        }
      }

      return this.#handleListNodes(listItems, 0, node);
    }

    // If it is a standard paragraph node, process normally
    schemaNode = this.#handleStandardNode(node);

    if ('attributes' in node) {
      const defaultStyleId = node.attributes['w:rsidRDefault'];

      const pPr = node.elements.find((el) => el.name === 'w:pPr');
      const styleTag = pPr?.elements.find((el) => el.name === 'w:pStyle');
      if (styleTag) {
        schemaNode.attrs['styleId'] = styleTag.attributes['w:val'];
      }

      const indent = pPr?.elements.find((el) => el.name === 'w:ind');
      if (indent) {
        const { 'w:left': left, 'w:right': right, 'w:firstLine': firstLine } = indent.attributes;
        schemaNode.attrs['indent'] = { 
          left: twipsToPixels(left),
          right: twipsToPixels(right),
          firstLine: twipsToPixels(firstLine),
        };
      }

      const justify = pPr?.elements.find((el) => el.name === 'w:jc');
      if (justify) {
        schemaNode.attrs['textAlign'] = justify.attributes['w:val'];
      }

      const { lineSpaceAfter, lineSpaceBefore } = this.#getDefaultStyleDefinition(defaultStyleId);
      const spacing = pPr?.elements.find((el) => el.name === 'w:spacing');
      if (spacing) {
        const {
          'w:after': lineSpaceAfterInLine,
          'w:before': lineSpaceBeforeInLine,
          'w:line': lineInLine,
        } = spacing.attributes;

        schemaNode.attrs['spacing'] = {
          lineSpaceAfter: twipsToPixels(lineSpaceAfterInLine) || lineSpaceAfter,
          lineSpaceBefore: twipsToPixels(lineSpaceBeforeInLine) || lineSpaceBefore,
          line: twipsToPixels(lineInLine),
        };
      }
    }
    return schemaNode;
  }

  #handleTrackChangeNode(node) {
    const { name } = node;
    const { attributes, elements } = this.#parseProperties(node);
    const schemaNode = this.#handleStandardNode(node);

    const subs = this.#convertToSchema(elements, true)
    const changeType = name === 'w:del' ? TrackDeleteMarkName : TrackInsertMarkName;
    const mappedAttributes = {
        wid: attributes['w:id'],
        date: attributes['w:date'],
        author: attributes['w:author'],
    }

    subs.forEach(subElement => {
      return subElement.marks.push({ type: changeType, attrs: mappedAttributes });
    });

    console.log("HERE!!!!", name, schemaNode, attributes, subs)

    return subs;
  }

  #handleDelText(node, insideTrackChange) {
      console.log(node, insideTrackChange)
      if(!insideTrackChange) return undefined;

      const nodeAsTextNode = this.#handleTextNode(node)

      nodeAsTextNode.type = 'text';
      console.log("2", nodeAsTextNode);
      return nodeAsTextNode;
  }

  /**
   * We need to pre-process nodes in a paragraph to combine nodes together where necessary ie: links
   * TODO: Likely will find more w:fldChar to deal with.
   *
   * @param {*} nodes
   * @returns
   */
  #preProcessNodesForFldChar(nodes) {
    const processedNodes = [];
    const nodesToCombine = [];
    let isCombiningNodes = false;
    nodes?.forEach((n) => {
      const fldChar = n.elements?.find((el) => el.name === 'w:fldChar');
      if (fldChar) {
        const fldType = fldChar.attributes['w:fldCharType'];
        if (fldType === 'begin') {
          isCombiningNodes = true;
          nodesToCombine.push(n);
        } else if (fldType === 'end') {
          nodesToCombine.push(n);
          isCombiningNodes = false;
        }
      }

      if (isCombiningNodes) {
        nodesToCombine.push(n);
      } else if (!isCombiningNodes && nodesToCombine.length) {

        // Need to extract all nodes between 'separate' and 'end' fldChar nodes
        const textStart = nodesToCombine.findIndex((n) => n.elements?.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'separate'));
        const textEnd = nodesToCombine.findIndex((n) => n.elements?.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'end'));
        const textNodes = nodesToCombine.slice(textStart + 1, textEnd);
        const instrText = nodesToCombine.find((n) => n.elements?.some((el) => el.name === 'w:instrText'))?.elements[0]?.elements[0].text;
        const urlMatch = instrText.match(/HYPERLINK\s+"([^"]+)"/);

        if (!urlMatch || urlMatch?.length < 2) return [];
        const url = urlMatch[1];

        const textMarks = [];
        textNodes.forEach((n) => {
          const rPr = n.elements.find((el) => el.name === 'w:rPr');
          if (!rPr) return;

          const { elements } = rPr;
          elements.forEach((el) => {
            textMarks.push(el);
          });
        });

        // Create a rPr and replace all nodes with the updated node.
        const linkMark = { name: 'link', attributes: { href: url} };
        const rPr = { name: 'w:rPr', type: 'element', elements: [linkMark, ...textMarks] }
        processedNodes.push({
          name: 'w:r',
          type: 'element',
          elements: [rPr, ...textNodes]
        });
      } else {
        processedNodes.push(n);
      }
    })
    return processedNodes;
  }

  #hasTextNode(elements) {
    const runs = elements.filter((el) => el.name === 'w:r');
    const runsHaveText = runs.some((run) => run.elements.some((el) => el.name === 'w:t'));
    return runsHaveText;
  }

  #wrapNodes(type, content) {
    return {
      type,
      content,
    }
  }

  #testForList(node, isInsideList = false) {
    const { elements } = node;
    const pPr = elements?.find(el => el.name === 'w:pPr')
    if (!pPr) return false;

    const paragraphStyle = pPr.elements?.find(el => el.name === 'w:pStyle');
    const isList = paragraphStyle?.attributes['w:val'] === 'ListParagraph';
    const hasNumPr = pPr.elements?.find(el => el.name === 'w:numPr');
    return isList || hasNumPr;
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
   * @param {number} [listLevel=0] - The current indentation level of the list.
   * @returns {Object} The processed list node with structured content.
   */
  #handleListNodes(listItems, listLevel = 0) {
    const parsedListItems = [];
    let overallListType;
    let listStyleType;

    for (let [index, item] of listItems.entries()) {
      // Skip items we've already processed
      if (item.seen) continue;

      // Sometimes there are paragraph nodes that only have pPr element and no text node - these are
      // Spacers in the XML and need to be appended to the last item.
      if (item.elements && !this.#hasTextNode(item.elements)) {
        const n = this.#handleStandardNode(item, listItems, index);
        parsedListItems[parsedListItems.length - 1]?.content.push(n);
        item.seen = true;
        continue;
      }

      // Get the properties of the node - this is where we will find depth level for the node
      // As well as many other list properties
      const { attributes, elements, marks = [] } = this.#parseProperties(item);
      const {
        listType,
        listOrderingType,
        ilvl,
        listrPrs,
        listpPrs,
        start,
        lvlText,
        lvlJc
      } = this.converter.getNodeNumberingDefinition(attributes, listLevel);
      listStyleType = listOrderingType;
      const intLevel = parseInt(ilvl);

      // Append node if it belongs on this list level
      const nodeAttributes = {};
      if (listLevel === intLevel) {
        overallListType = listType;
        item.seen = true;

        const schemaElements = [];
        schemaElements.push(this.#wrapNodes('paragraph', this.#convertToSchema(elements)?.filter(n => n)));

        console.debug('\n\n LIST ITEM', listpPrs, listrPrs, start, lvlText, lvlJc, '\n\n')

        if (listpPrs) nodeAttributes['listParagraphProperties'] = listpPrs;
        if (listrPrs) nodeAttributes['listRunProperties'] = listrPrs;
        nodeAttributes['order'] = start;
        nodeAttributes['lvlText'] = lvlText;
        nodeAttributes['lvlJc'] = lvlJc;
        nodeAttributes['attributes'] = {
          parentAttributes: item?.attributes || null,
        }
        parsedListItems.push(this.#createListItem(schemaElements, nodeAttributes, []));
      }

      // If this item belongs in a deeper list level, we need to process it by calling this function again
      // But going one level deeper.
      else if (listLevel < intLevel) {
        const sublist = this.#handleListNodes(listItems.slice(index), listLevel + 1);
        const lastItem = parsedListItems[parsedListItems.length - 1];
        if (!lastItem) {
          parsedListItems.push(this.#createListItem([sublist], nodeAttributes, []));
        } else {
          lastItem.content.push(sublist);
        }
      }

      // If this item belongs in a higher list level, we need to break out of the loop and return to higher levels
      else break;
    }

    return {
      type: overallListType || 'bulletList',
      content: parsedListItems,
      attrs: {
        'list-style-type': listStyleType,
        attributes: {
          'parentAttributes': listItems[0]?.attributes || null,
        }
      }
    };
  }

  /**
   * Creates a list item node with specified content and marks.
   *
   * @param {Array} content - The content of the list item.
   * @param {Array} marks - The marks associated with the list item.
   * @returns {Object} The created list item node.
   */
  #createListItem(content, attrs, marks) {
    return {
      type: 'listItem',
      content,
      attrs,
      marks,
    };
  }

  #handleTextNode(node) {
    const { type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = this.#parseProperties(node);

    // Text nodes have no children. Only text, and there should only be one child
    let text;
    if (elements.length === 1) text = elements[0].text;

    // Word sometimes will have an empty text node with a space attribute, in that case it should be a space
    else if (!elements.length && 'attributes' in node && node.attributes['xml:space'] === 'preserve') {
      text = ' ';
    }

    // Ignore others - can catch other special cases here if necessary
    else return null;

    return {
      type: this.#getElementName(node),
      text: text,
      attrs: { type, attributes: attributes || {}, },
      marks,
    };
  }


  /**
   *
   * @param property
   * @returns {{type: string, attrs: {}}[]}
   */
  #parseMarks(property) {
    const marks = [];
    const seen = new Set();

    property.elements.forEach((element) => {
      const marksForType = SuperConverter.markTypes.filter((mark) => mark.name === element.name);
      if (!marksForType.length) {
        const missingMarks = [
          'w:shd',
          'w:rStyle',
          'w:pStyle',
          'w:numPr',
          'w:outlineLvl',
          'w:bdr',
          'w:pBdr',
          'w:noProof',
          'w:highlight',
          'w:contextualSpacing',
          'w:keepNext',
          'w:tabs',
          'w:keepLines'
        ]
        if (missingMarks.includes(element.name)) console.debug('❗️❗️ATTN: No marks found for element:', element.name);
        // else throw new Error(`No marks found for element: ${element.name}`);
      }

      marksForType.forEach((m) => {
        if (!m || seen.has(m.type)) return;
        seen.add(m.type);

        const { attributes = {} } = element;
        const newMark = { type: m.type }

        if (attributes['w:val'] == "0" || attributes['w:val'] === 'none') {
          return;
        }

        // Use the parent mark (ie: textStyle) if present
        if (m.mark) newMark.type = m.mark;

        // Marks with attrs: we need to get their values
        if (Object.keys(attributes).length) {
          const value = this.#getMarkValue(m.type, attributes);

          newMark.attrs = {};
          newMark.attrs[m.property] = value;
        }
        marks.push(newMark);
      })
    });
    return this.#createImportMarks(marks);
  }

  /**
   *
   * @param rPr
   * @param {{type: string, attrs: {}}[]} currentMarks
   * @returns {{type: string, attrs: {}}[]} a trackMarksMark, or an empty array
   */
  #handleStyleChangeMarks(rPr, currentMarks) {
    const styleChangeMark = rPr.elements?.find((el) => el.name === 'w:rPrChange')
    if(!styleChangeMark) {
      return []
    }

    const { attributes } = styleChangeMark;
    const mappedAttributes = {
      wid: attributes['w:id'],
      date: attributes['w:date'],
      author: attributes['w:author'],
    }
    const { marks: submarks, unknownMarks } = this.#parseMarks(styleChangeMark);
    return [{type: TrackMarksMarkName, attrs: {...mappedAttributes, before: submarks, after: [...currentMarks]}}]
  }

  #getIndentValue(attributes) {
    let value  = attributes['w:left'];
    if (!value) value = attributes['w:firstLine'];
    return `${twipsToInches(value)}in`
  }

  #getLineHeightValue(attributes) {
    let value = attributes['w:line'];

    // TODO: Figure out handling of additional line height attributes from docx
    // if (!value) value = attributes['w:lineRule'];
    // if (!value) value = attributes['w:after'];
    // if (!value) value = attributes['w:before'];
    if (!value || value == 0) return null;
    return `${twipsToInches(value)}in`;
  }

  #getMarkValue(markType, attributes) {
    if (markType === 'tabs') markType = 'textIndent';

    const markValueMapper = {
      color: () => `#${attributes['w:val']}`,
      fontSize: () => `${attributes['w:val']/2}pt`,
      textIndent: () => this.#getIndentValue(attributes),
      fontFamily: () => attributes['w:ascii'],
      lineHeight: () => this.#getLineHeightValue(attributes),
      textAlign: () => attributes['w:val'],
      link: () => attributes['href'],
      underline: () => attributes['w:val'],
    }

    if (!(markType in markValueMapper)) {
      console.debug('\n\n ❗️❗️ No value mapper for:', markType, 'Attributes:', attributes)
    };

    // Returned the mapped mark value
    if (markType in markValueMapper) {
      const f = markValueMapper[markType];
      return markValueMapper[markType]();
    }
  }

  /**
   * TODO: There are so many possible styles here - confirm what else we need.
   */
  #getDefaultStyleDefinition(defaultStyleId) {
    const result = { lineSpaceBefore: null, lineSpaceAfter: null };
    const styles = this.converter.convertedXml['word/styles.xml'];
    if (!styles) return result;

    const { elements } = styles.elements[0];
    // console.debug('Default style ID elements:', elements)
    const elementsWithId = elements.filter((el) => {
      return el.elements.some((e) => {
        return 'attributes' in e && e.attributes['w:val'] === defaultStyleId;
      });
    });

    const firstMatch = elementsWithId[0];
    if (!firstMatch) return result;

    const pPr = firstMatch.elements.find((el) => el.name === 'w:pPr');
    const spacing = pPr?.elements.find((el) => el.name === 'w:spacing');
    if (!spacing) return result;
    const lineSpaceBefore = twipsToPixels(spacing.attributes['w:before']);
    const lineSpaceAfter = twipsToPixels(spacing.attributes['w:after']);
    return { lineSpaceBefore, lineSpaceAfter };
  }

  #parseProperties(node) {
      /**
       * What does it mean for a node to have a properties element?
       * It would have a child element that is: w:pPr, w:rPr, w:sectPr
       */
      const marks = [];
      const { attributes = {}, elements = [] } = node;
      const { nodes, paragraphProperties = {}, runProperties = {} } = this.#splitElementsAndProperties(elements);
      paragraphProperties.elements = paragraphProperties?.elements?.filter((el) => el.name !== 'w:rPr');

      // Get the marks from the run properties
      if (runProperties && runProperties?.elements?.length) {
        marks = this.#parseMarks(runProperties);
      };

      if (paragraphProperties && paragraphProperties.elements?.length) {
        marks.push(...this.#parseMarks(paragraphProperties));
      }
      //add style change marks
      marks.push(...this.#handleStyleChangeMarks(runProperties, marks));

      // Maintain any extra properties
      if (paragraphProperties && paragraphProperties.elements?.length) {
        attributes['paragraphProperties'] = paragraphProperties;
      }

      // If this is a paragraph, don't apply marks but apply attributes directly
      if (marks && node.name === 'w:p') {
        marks.forEach((mark) => {
          const attrValue = Object.keys(mark.attrs)[0];
          const value = mark.attrs[attrValue];
          attributes[attrValue] = value;
        });
        marks.length = 0;
      }
      return { elements: nodes, attributes, marks, unknownMarks }
  }

  #splitElementsAndProperties(elements) {
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

  #getDocumentStyles(node) {
    const sectPr = node.elements.find((n) => n.name === 'w:sectPr');
    const styles = {};

    sectPr.elements.forEach((el) => {
      const { name, attributes } = el;
      switch (name) {
        case 'w:pgSz':
          styles['pageSize'] = {
            width: twipsToInches(attributes['w:w']),
            height: twipsToInches(attributes['w:h']),
          }
          break;
        case 'w:pgMar':
          styles['pageMargins'] = {
            top: twipsToInches(attributes['w:top']),
            right: twipsToInches(attributes['w:right']),
            bottom: twipsToInches(attributes['w:bottom']),
            left: twipsToInches(attributes['w:left']),
            header: twipsToInches(attributes['w:header']),
            footer: twipsToInches(attributes['w:footer']),
            gutter: twipsToInches(attributes['w:gutter']),
          }
          break;
        case 'w:cols':
          styles['columns'] = {
            space: twipsToInches(attributes['w:space']),
            num: attributes['w:num'],
            equalWidth: attributes['w:equalWidth'],
          }
          break;
        case 'w:docGrid':
          styles['docGrid'] = {
            linePitch: twipsToInches(attributes['w:linePitch']),
            type: attributes['w:type'],
          }
          break;
      }
    });
    return styles;
  }

  #getHeaderFooter(el, elementType) {
    const rels = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const relationships = rels.elements.find((el) => el.name === 'Relationships');
    const { elements } = relationships;

    // sectionType as in default, first, odd, even
    const sectionType = el.attributes['w:type'];

    const rId = el.attributes['r:id'];
    const rel = elements.find((el) => el.attributes['Id'] === rId);
    const target = rel.attributes['Target'];

    // Get the referenced file (ie: header1.xml)
    const referenceFile = this.converter.convertedXml[`word/${target}`];
    this.currentFileName = target;

    const schema = this.#convertToSchema(referenceFile.elements[0].elements);
    let storage, storageIds;

    if (elementType === 'header') {
      storage = this.converter.headers;
      storageIds = this.converter.headerIds;
    } else if (elementType === 'footer') {
      storage = this.converter.footers;
      storageIds = this.converter.footerIds;
    }

    storage[rId] = { type: 'doc', content: [...schema] };
    storageIds[sectionType] = rId;
  }

  #handleFieldAnnotationNode(node) {
    const sdtPr = node.elements.find((el) => el.name === 'w:sdtPr');
    const alias = sdtPr?.elements.find((el) => el.name === 'w:alias');
    const tag = sdtPr?.elements.find((el) => el.name === 'w:tag');
    const fieldType = sdtPr?.elements.find((el) => el.name === 'w:fieldType')?.attributes['w:val'];
    const type = sdtPr?.elements.find((el) => el.name === 'w:fieldTypeShort')?.attributes['w:val'];
    const fieldColor = sdtPr?.elements.find((el) => el.name === 'w:fieldColor')?.attributes['w:val'];

    const attrs = {
      type,
      fieldId: tag?.attributes['w:val'],
      displayLabel: alias?.attributes['w:val'],
      fieldType,
      fieldColor,
    }
  
    const result = {
      type: 'fieldAnnotation',
      attrs,
    }
    return result;
  }
}