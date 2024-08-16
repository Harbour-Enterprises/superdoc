import { SuperConverter } from './SuperConverter';
import { twipsToPixels, twipsToInches } from './helpers.js';
import { toKebabCase } from '@common/key-transform.js';


/**
 * The DocxImporter class is responsible for converting a JSON representation of a DOCX file.
 * It depends on SuperConverter and its xml converted data to build the schema.
 * 
 * Calling getSchema() will return a ProseMirror schema object.
 */
export class DocxImporter {

  constructor(converter) {
    this.converter = converter;
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
   * @returns 
   */
  #convertToSchema(elements) {
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
          processedElements.push(...this.#handleRunNode(node));
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
        default:
          schemaNode = this.#handleStandardNode(node);
      }

      if (schemaNode?.type) {
        const ignore = ['runProperties'];
        if (!ignore.includes(schemaNode.type)) processedElements.push(schemaNode);
        // else console.debug('No schema node:', node);
      }
    }
    return processedElements;
  }
  
  #handleHyperlinkNode(node) {
    const rels = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const relationships = rels.elements.find((el) => el.name === 'Relationships');
    const { elements } = relationships;

    const { attributes } = node;
    const rId = attributes['r:id'];

    // TODO: Check if we need this atr
    const history = attributes['w:history'];

    const rel = elements.find((el) => el.attributes['Id'] === rId);
    const { attributes: relAttributes } = rel;
    const href = relAttributes['Target'];
    
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

  #handleRunNode(node) {
    let processedRun = this.#convertToSchema(node.elements)?.filter(n => n) || [];
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
    console.debug('\n\n PROCESSED ELEMENTS:', processedElements, '\n\n')

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

      // TODO - Check that this change is OK
      return this.#handleListNodes(listItems, 0, node);
    }      

    // If it is a standard paragraph node, process normally
    schemaNode = this.#handleStandardNode(node);

    if ('attributes' in node) {
      const defaultStyleId = node.attributes['w:rsidRDefault'];
      const { lineSpaceAfter, lineSpaceBefore } = this.#getDefaultStyleDefinition(defaultStyleId);

      if (!('attributes' in schemaNode)) schemaNode.attributes = {};
      schemaNode.attrs['paragraphSpacing'] = { lineSpaceAfter, lineSpaceBefore };
    }
    return schemaNode;
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
        const textStart = nodesToCombine.findIndex((n) => n.elements.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'separate'));
        const textEnd = nodesToCombine.findIndex((n) => n.elements.some((el) => el.name === 'w:fldChar' && el.attributes['w:fldCharType'] === 'end'));
        const textNodes = nodesToCombine.slice(textStart + 1, textEnd);
        const instrText = nodesToCombine.find((n) => n.elements.some((el) => el.name === 'w:instrText'))?.elements[0]?.elements[0].text;
        const urlMatch = instrText.match(/HYPERLINK\s+"([^"]+)"/);
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

  #getIndentValue(attributes) {
    let value  = attributes['w:left'];
    if (!value) value = attributes['w:firstLine'];
    return `${twipsToInches(value).toFixed(2)}in`
  }

  #getLineHeightValue(attributes) {
    let value = attributes['w:line'];

    // TODO: Figure out handling of additional line height attributes from docx
    // if (!value) value = attributes['w:lineRule'];
    // if (!value) value = attributes['w:after'];
    // if (!value) value = attributes['w:before'];
    if (!value || value == 0) return null;
    return `${twipsToInches(value).toFixed(2)}in`;
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
      let marks = [];
      const { attributes = {}, elements = [] } = node;
      const { nodes, paragraphProperties = {}, runProperties = {} } = this.#splitElementsAndProperties(elements);
      paragraphProperties.elements = paragraphProperties?.elements?.filter((el) => el.name !== 'w:rPr');

      // Get the marks from the run properties
      if (runProperties && runProperties?.elements?.length) marks = this.#parseMarks(runProperties);
      if (paragraphProperties && paragraphProperties.elements?.length) {
        marks.push(...this.#parseMarks(paragraphProperties));
      }

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
        marks = [];
      }
      return { elements: nodes, attributes, marks }
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
}