import xmljs from 'xml-js';
import {orderedListTypes, unorderedListTypes, getNodeNumberingDefinition } from './numbering';

/**
 * Class to translate from DOCX XML to Prose Mirror Schema and back
 * 
 * Will need to be updated as we find new docx tags.
 * 
 */
class SuperConverter {

  static allowedElements = Object.freeze({
    'w:document': 'doc',
    'w:body': 'body',
    'w:p': 'paragraph',
    'w:r': 'run',
    'w:t': 'text',

    // Formatting only
    'w:sectPr': 'sectionProperties',
    'w:rPr': 'runProperties',

    // Comments
    'w:commentRangeStart': 'commentRangeStart',
    'w:commentRangeEnd': 'commentRangeEnd',
    'w:commentReference': 'commentReference',

  });

  static markTypes = [
    { name: 'w:b', type: 'bold' },
    { name: 'w:bCs', type: 'bold' },
    { name: 'w:i', type: 'italic' },
    { name: 'w:iCs', type: 'italic' },
    { name: 'w:u', type: 'underline' },
    { name: 'w:strike', type: 'strike' },
  ]

  static propertyTypes = Object.freeze({
    'w:pPr': 'paragraphProperties',
    'w:rPr': 'runProperties',
    'w:sectPr': 'sectionProperties',
    'w:numPr': 'numberingProperties',
  });

  static elements = new Set([
    'w:document',
    'w:body',
    'w:p',
    'w:r',
    'w:t',
  ])

  constructor(params = null) {
    // Suppress logging when true
    this.debug = params?.debug || false;

    // The docx as a list of files
    this.convertedXml = {};
    this.docx = params?.docx || [];

    // XML inputs
    this.xml = params?.xml;
    this.declaration = null;

    // Processed additional content
    this.numbering = null;

    // The JSON converted XML before any processing. This is simply the result of xml2json
    this.initialJSON = null;

    // This is the JSON schema that we will be working with
    this.json = params?.json;

    this.tagsNotInSchema = ['w:body']
    this.savedTagsToRestore = [];

    // Parse the initial XML, if provided
    // this.log('Original XML:', this.xml)
    if (this.docx.length || this.xml) this.parseFromXml();
  }


  log(...args) {
    if (this.debug) console.debug(...args);
  }

  getTagName(name) {
    const keys = Object.keys(SuperConverter.allowedElements)
    return keys.find(key => SuperConverter.allowedElements[key] === name);
  }

  getTagsFromMark(mark) {
    return SuperConverter.markTypes.filter(m => m.type === mark);
  }

  parseFromXml() {
    this.docx?.forEach(file => {
      this.convertedXml[file.name] = this.parseXmlToJson(file.content);
    });
    this.initialJSON = this.convertedXml['word/document.xml'];

    if (!this.initialJSON) this.initialJSON = this.parseXmlToJson(this.xml);
    this.declaration = this.initialJSON?.declaration;
  }

  parseXmlToJson(xml) {
    return JSON.parse(xmljs.xml2json(xml, null, 2))
  }

  getElementName(element) {
    const name = element.name || element.type;
    return SuperConverter.allowedElements[name];
  }

  getSchema() {
    const json = JSON.parse(JSON.stringify(this.initialJSON));
    const result = {
      type: 'doc',
      content: this.convertToSchema(json.elements[0].elements),
      attrs: {
        attributes: json.elements[0].attributes,
      }
    }
    return result;
  }


  convertToSchema(elements) {
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
          return this.#handleInputBodyNode(node);
        case 'w:r':
          processedElements.push(...this.#handleInputRunNode(node));
          continue;
        case 'w:p':
          schemaNode = this.#handleParagraphProcessing(node, elements, index);
          break;
        case 'w:t':
          schemaNode = this.#handleTextNode(node);
          break;
        default:
          schemaNode = this.#handleStandardNode(node);
      }

      if (schemaNode?.type) {
        const ignore = ['runProperties'];
        if (ignore.includes(schemaNode.type)) console.debug('No schema node:', node);
        else processedElements.push(schemaNode);
      }
    }
    return processedElements;
  }

  /**
   * Handle body nodes from XML. We don't use them in the schema but we do
   * need to store the original info for export later.
   */
  #handleInputBodyNode(node) {
    this.savedTagsToRestore.push({ ...node });
    const ignoreNodes = ['w:sectPr'];
    const content = node.elements.filter((n) => !ignoreNodes.includes(n.name));
    return this.convertToSchema(content);
  }

  /**
   * Process input run nodes to remove them from the schema
   * 
   * @param {object} node 
   * @returns 
   */
  #handleInputRunNode(node) {
    let processedRun = this.convertToSchema(node.elements)?.filter(n => n) || [];
    const hasRunProperties = node.elements.some(el => el.name === 'w:rPr');
    if (hasRunProperties) {
      const { marks = [] } = this.#parseProperties(node);
      processedRun = processedRun.map(n => ({ ...n, marks }));
    }
    return processedRun;
  }

  /**
   * Special cases of w:p based on paragraph properties
   * 
   * If we detect a list node, we need to get all nodes that are also lists and process them together
   * in order to combine list item nodes into list nodes.
   */
  #handleParagraphProcessing(node, elements, index) {
    let schemaNode;

    // Check if this paragraph node is a lsit
    if (this.#testForList(node)) {          
      // Get all siblings that are list items and haven't been processed yet.
      const siblings = [...elements.slice(index)];
      const listItems = [];

      // Iterate each item until we find the end of the list (a non-list item),
      // then send to the list handler for processing.
      let possibleList = siblings.shift();
      while (possibleList && this.#testForList(possibleList)) {
        listItems.push(possibleList);
        possibleList = siblings.shift();
      }

      console.debug('\n\n INPUT LIST NODE', node.attributes, '\n\n')
      schemaNode = this.#handleListNodes(listItems, 0, node);
    }      

    // If it is a standard paragraph node, process normally
    if (!schemaNode) schemaNode = this.#handleStandardNode(node);
    return schemaNode;
  }

  #wrapNodes(type, content) {
    return {
      type,
      content,
    }
  }

  #testForList(node) {
    const { elements } = node;
    const pPr = elements?.find(el => el.name === 'w:pPr')
    if (!pPr) return false;

    const paragraphStyle = pPr.elements.find(el => el.name === 'w:pStyle');
    const isList = paragraphStyle?.attributes['w:val'] === 'ListParagraph';
    const hasNumPr = pPr.elements.find(el => el.name === 'w:numPr');
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
  #handleListNodes(listItems, listLevel = 0, parent = null) {
    const parsedListItems = [];
    let overallListType;
    let listStyleType;

    for (let [index, item] of listItems.entries()) {
      // Skip items we've already processed
      if (item.seen) continue;

      // Get the properties of the node - this is where we will find depth level for the node
      // As well as many other list properties
      const { attributes, elements, marks = [] } = this.#parseProperties(item);
      const { listType, listOrderingType, ilvl, listrPrs, numId, listpPrs, start, lvlText, lvlJc } = this.getNodeNumberingDefinition(attributes, listLevel);
      listStyleType = listOrderingType;
      const intLevel = parseInt(ilvl);

      // Append node if it belongs on this list level
      const nodeAttributes = {};
      if (listLevel === intLevel) {
        overallListType = listType;
        item.seen = true;
        const schemaElements = this.convertToSchema(elements)?.filter(n => n);

        if (listpPrs) nodeAttributes['listParagraphProperties'] = listpPrs;
        if (listrPrs) nodeAttributes['listRunProperties'] = listrPrs;
        nodeAttributes['start'] = start;
        nodeAttributes['lvlText'] = lvlText;
        nodeAttributes['lvlJc'] = lvlJc;
        nodeAttributes['attributes'] = {
          parentAttributes: item?.attributes || null,
        }
        parsedListItems.push(this.#createListItem(schemaElements, nodeAttributes, marks));
      } 

      // If this item belongs in a deeper list level, we need to process it by calling this function again
      // But going one level deeper.
      else if (listLevel < intLevel) {
        const sublist = this.#handleListNodes(listItems.slice(index), listLevel + 1);
        const lastItem = parsedListItems[parsedListItems.length - 1];
        if (!lastItem) parsedListItems.push(sublist);
        else {
          lastItem.content.push(sublist);
        }
      }
      
      // If this item belongs in a higher list level, we need to break out of the loop and return to higher levels
      else {
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

  #handleStandardNode(node) {
    // Parse properties
    const { name, type } = node;
    const { attributes, elements, marks = [] } = this.#parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
      content.push(...this.convertToSchema(elements));
    }

    return {
      type: this.getElementName(node),
      content,
      attrs: { type, attributes: attributes || {}, },
      marks,
    };
  }


  #handleTextNode(node) {
    const { type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = this.#parseProperties(node);

    // Text nodes have no children. Only text.
    let text;
    if (elements.length === 1) text = elements[0].text;
    else return null;

    return {
      type: this.getElementName(node),
      text: text || '',
      attrs: { type, attributes: attributes || {}, },
      marks,
    };
  }


  #parseMarks(property) {
    const marks = [];
    const seen = new Set();
    property.elements.forEach((element) => {
      const marksForType = SuperConverter.markTypes.filter((mark) => mark.name === element.name);
      marksForType.forEach((m) => {
        if (!m || seen.has(m.type)) return;
        seen.add(m.type);
        marks.push({ type: m.type });
      })
    });

    // if (marks.length) console.debug('Marks:', marks )
    return marks;
  }


  #parseProperties(node) {
      /**
       * What does it mean for a node to have a properties element?
       * It would have a child element that is: w:pPr, w:rPr, w:sectPr
       */
      let marks = [];
      const { attributes = {}, elements = [] } = node;
      const [nodes, properties] = this.#splitElementsAndProperties(elements);

      if (properties.length) {
        properties.forEach(property => {
          const propType = SuperConverter.propertyTypes[property.name];
          attributes[propType] = property;

          marks = this.#parseMarks(property);
        }); 
      }
      return { elements: nodes, attributes, marks }
  }


  #splitElementsAndProperties(elements) {
    return elements.reduce(
      ([els, props], el) => {
        if (SuperConverter.propertyTypes[el.name]) props.push(el);
        else els.push(el);
        return [els, props];
      }, [[], []]
    );
  }






  outputToJson(data) {
    const firstElement = data;
    const result = {
      declaration: this.declaration,
      elements: this.#outputProcessNodes([firstElement]),
    }
    // console.debug('FINAL RESULT', result)
    return result;
  }

  #outputProcessNodes(nodes, parent = null) {
    const resultingElements = [];
    let index = 0;
    for (let node of nodes) {
      if (node.seen) continue;
      let skip = false;

      // Special output handling
      switch (node.type) {
        case 'doc':
          node = this.#outputHandleDocumentNode(node);
          break;
        case 'text':
          node = this.#outputHandleTextNode(nodes.slice(index));
          skip = true;
          break;
        case 'bulletList':
          //console.debug("\n\n BULLET LIST", node.type, node, '\n\n')
          const { content, attrs } = node;
          const listType = attrs['list-style-type'];

          const flatContent = this.#flattenContent(content);
          console.debug('\n\n FLAT CONTENT', flatContent, '\n\n')

          // Each item in the content becomes its own paragraph item in the output
          const output = [];
          flatContent.forEach((n) => {
            const { attrs = {} } = n;
            const { listParagraphProperties } = attrs;
            const { content: listContent } = n;

            const listElements = [];
            if (listParagraphProperties) {
              const props = [];
              Object.keys(listParagraphProperties).forEach((key) => {
                props.push({ name: key, attributes: { 'w:val': listParagraphProperties[key] } });
              });
              listElements.push({
                name: 'w:pPr',
                elements: props,
              });
              listElements.push({
                name: 'w:r',
                elements: [
                  { name: 'w:t', type: 'element', elements: [{ text: listContent[0].text, type: 'text' }], },
                ]
              })
            };

            const parentAttributes = n.attrs.attributes.parentAttributes || {};
            delete parentAttributes.paragraphProperties;
  
            output.push({
              name: 'w:p',
              attributes: n.attrs.attributes.parentAttributes || {},
              elements: listElements,
            });
          })
          console.debug('Bullet list item:', JSON.stringify(output));
          resultingElements.push(...output);
          skip = true;
          break;
        case 'orderedList':
          // console.debug("\n\n ORDERED LIST", node.type, node, '\n\n')
          break;
        default:
          // console.debug("\n\n OTHER NODE", node.type, node, '\n\n')
      }

      let resultingNode = node;
      let name = this.getTagName(node.type);
      if (!skip) {
        const { content, attrs } = node;
        let attributes = attrs?.attributes || {};

        let nodeContents = [];
        if (content && content.length) nodeContents.push(...this.#outputProcessNodes(content, node));

        resultingNode = this.#getOutputNode(name, nodeContents, attributes);
        const sectionProperties = attributes?.sectionProperties;
        if (sectionProperties) {
          delete resultingNode.attributes;
          resultingNode.elements.push(sectionProperties)
        }
      }
      
      index++;
      resultingElements.push(resultingNode);
      if (SuperConverter.elements.has(name)) resultingNode.type = 'element';
    }

    return resultingElements;
  }

  #flattenContent(content) {
    const flatContent = [];
  
    function recursiveFlatten(items) {
      items.forEach(item => {
        const { content, type } = item;
        if (type === 'bulletList') {
          recursiveFlatten(content);
        } else {
          if (content.length > 1) {
            const copy = { ...item, content: [content[0]]};
            flatContent.push(copy);
            recursiveFlatten(content.slice(1));
          } else {
            flatContent.push(item);

          }
        }
      });
    }
  
    recursiveFlatten(content);
    return flatContent;
  }

  #getOutputNode(name, elements, attributes = {}) {
    return {
      name,
      elements,
      attributes: Object.keys(attributes).length ? attributes : undefined,
      type: 'element',
    }
  }

  #outputHandleDocumentNode(node) {
    // Restore section props
    const storedBody = this.savedTagsToRestore.find((n) => n.name === 'w:body');
    const sectPr = storedBody.elements.find((n) => n.name === 'w:sectPr');
    const bodyNode = {
      type: 'body',
      content: node.content,
      attrs: {
        attributes: {
          sectionProperties: sectPr
        },
      }
    }
    node.content = [bodyNode];
    return node;
  }

  #outputHandleTextNode(nodes) {
    const groupedTextNodes = [];
    let index = 0;
    let groupedNode = nodes[index];
    const attrs = groupedNode?.attrs;
    const marks = groupedNode?.marks;

    let runProperties = null;
    if (marks) {
      console.debug('Marks:', marks);

      const elements = [];
      marks.forEach((mark) => {
        const marksToApply = SuperConverter.markTypes.filter((m) => m.type === mark.type)
        marksToApply.forEach((m) => {
          elements.push({
            name: m.name,
            type: 'element',
          })
        });
      });

      runProperties = {
        name: 'w:rPr',
        type: 'element',
        elements
      }
    }

    while (groupedNode?.type === 'text' && groupedNode.attrs === attrs && groupedNode.marks === marks) {
      groupedNode.seen = true;
      groupedTextNodes.push(groupedNode);
      groupedNode = nodes[++index];
    }
    
    const nodeContents = groupedTextNodes.map((n) => { 
      const { text } = n;
      const hasLeadingOrTrailingSpace = /^\s|\s$/.test(text);
      const space = hasLeadingOrTrailingSpace ? 'preserve' : null;
      const attrs = space ? { 'xml:space': space } : null;

      const newNode = {
        type: 'element',
        name: 'w:t',
        elements: [{ text: n.text, type: 'text' }]
      }
      if (attrs && Object.keys(attrs).length) newNode.attributes = attrs;
      return newNode;
    });

    if (runProperties) {
      console.debug('Run properties:', runProperties)
      nodeContents.unshift(runProperties);
    }
    const name = this.getTagName('run');
    const output = this.#getOutputNode(name, nodeContents, attrs);
    console.debug('Output:', output)
    return output;
  }
  

  #outputHandleListNode(node) {

  }

  /**
   * XML Output section
   *
   * Convert to XML from SCHEMA
   * ❗️ TODO: Much to do here. Anything to do with marks added inside the editor is not yet implemented
   */
  schemaToXml(data) {
    console.debug('[SuperConverter] schemaToXml:', data);
    const result = this._generate_xml_as_list(data);
    return result.join('');
  }

  _generate_xml_as_list(data) {
    const json = JSON.parse(JSON.stringify(data));
    const firstElement = json.elements[0];
    const declaration = this.declaration.attributes;    
    const xmlTag = `<?xml${Object.entries(declaration).map(([key, value]) => ` ${key}="${value}"`).join('')}?>`;
    const result = this._generateXml(firstElement);
    const final = [xmlTag, ...result];
    return final;
  }

  _generateXml(node) {
    const { name, elements, attributes } = node;
    let tag = `<${name}`;

    for (let attr in attributes) {
      tag += ` ${attr}="${attributes[attr]}"`;
    }

    const selfClosing = !elements || !elements.length;
    if (selfClosing) tag += ' />';
    else tag += '>';
    let tags = [tag];

    if (name === 'w:t') {
      tags.push(elements[0].text);
    } else {

      // Recursively add the children
      if (elements) {
        for (let child of elements) {
          tags.push(...this._generateXml(child));
        }
      }
    }

    if (!selfClosing) tags.push(`</${name}>`);
    return tags;
  }
}

SuperConverter.prototype.getNodeNumberingDefinition = getNodeNumberingDefinition;
export { SuperConverter }