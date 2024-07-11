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
    const startElements = json.elements;
    const result = {
      type: 'doc',
      content: this.convertToSchema(json.elements[0].elements),
    }

    console.debug('--- result', result, '\n\n')
    // this.log('\nSchema updated:', JSON.stringify(result, null, 2))
    return result;
  }


  convertToSchema(elements) {
    console.debug('\nConvert to schema:', elements,'\n')
    if (!elements || !elements.length) return;

    const processedElements = [];
    for (let index = 0; index < elements.length; index++) {
      const node = elements[index];
      if (node.seen) continue;

      // We will build a prose mirror ready schema node from XML node 
      let schemaNode;
      switch (node.name) {
        case 'w:body':
          this.savedTagsToRestore.push({ ...node });
          const ignoreNodes = ['w:sectPr'];
          const content = node.elements.filter((n) => !ignoreNodes.includes(n.name));
          const result = this.convertToSchema(content);
          return result;
        case 'w:r':
          let processedRun = [];
          processedRun = this.convertToSchema(node.elements)?.filter(n => n);
          if (node.elements.find(el => el.name === 'w:rPr')) {
            const { marks = [] } = this._parseProperties(node);
            processedRun = processedRun.map((n) => {
              return { ...n, marks }
            });
          }
          processedElements.push(...processedRun)
          continue;
        case 'w:p':
          schemaNode = this.#handleParagraphProcessing(node, elements, index);
          break;
        case 'w:t':
          schemaNode = this._handleTextNode(node);
          break;
        default:
          schemaNode = this._handleStandardNode(node);
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

      schemaNode = this.#handleListNodes(listItems);
    }      

    // If it is a standard paragraph node, process normally
    if (!schemaNode) schemaNode = this._handleStandardNode(node);
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
  #handleListNodes(listItems, listLevel = 0) {
    const parsedListItems = [];
    let overallListType;
    let listStyleType;

    for (let [index, item] of listItems.entries()) {
      // Skip items we've already processed
      if (item.seen) continue;

      // Get the properties of the node - this is where we will find depth level for the node
      // As well as many other list properties
      const { attributes, elements, marks = [] } = this._parseProperties(item);
      const { listType, listOrderingType, ilvl, listrPrs, numId, listpPrs, start, lvlText, lvlJc } = this.getNodeNumberingDefinition(attributes, listLevel);
      listStyleType = listOrderingType;
      const intLevel = parseInt(ilvl);

      // Append node if it belongs on this list level
      if (listLevel === intLevel) {
        overallListType = listType;
        item.seen = true;
        const schemaElements = this.convertToSchema(elements)?.filter(n => n);

        if (listpPrs) attributes['listParagraphProperties'] = listpPrs;
        if (listrPrs) attributes['listRunProperties'] = listrPrs;
        attributes['start'] = start;
        attributes['lvlText'] = lvlText;
        attributes['lvlJc'] = lvlJc;
        parsedListItems.push(this.#createListItem(schemaElements, attributes, marks));
      } 

      // If this item belongs in a deeper list level, we need to process it by calling this function again
      // But going one level deeper.
      else if (listLevel < intLevel) {
        const sublist = this.#handleListNodes(listItems.slice(index), listLevel + 1);
        const lastItem = parsedListItems[parsedListItems.length - 1];
        if (!lastItem) parsedListItems.push(sublist);
        else {
          lastItem.content[0].content.push(sublist);
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
      content: [this.#wrapNodes('paragraph', content)],
      attrs,
      marks,
    };
  }




  _handleStandardNode(node) {
    // Parse properties
    const { name, type } = node;
    const { attributes, elements, marks = [] } = this._parseProperties(node);

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


  _handleTextNode(node) {
    const { type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = this._parseProperties(node);

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


  _parseMarks(property) {
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


  _parseProperties(node) {
      /**
       * What does it mean for a node to have a properties element?
       * It would have a child element that is: w:pPr, w:rPr, w:sectPr
       */
      let marks = [];
      const { attributes = {}, elements = [] } = node;
      const [nodes, properties] = this._splitElementsAndProperties(elements);

      if (properties.length) {
        properties.forEach(property => {
          const propType = SuperConverter.propertyTypes[property.name];
          attributes[propType] = property;

          marks = this._parseMarks(property);
        }); 
      }
      return { elements: nodes, attributes, marks }
  }


  _splitElementsAndProperties(elements) {
    return elements.reduce(
      ([els, props], el) => {
        if (SuperConverter.propertyTypes[el.name]) props.push(el);
        else els.push(el);
        return [els, props];
      }, [[], []]
    );
  }






  outputToJson(data) {
    // console.debug('[SuperConverter] outputToJSON:', data);
    const firstElement = data;
    const result = {
      declaration: this.declaration,
      elements: [this.#outputNodeToJson(firstElement)],
    }
    return result;
  }

  #preProcessTextNodes(node, parent) {
    const { content = [] } = node;
    const textNodes = content.filter((n) => n.type === 'text');
    if (!textNodes.length) return [node];

    const indexInParent = parent.content?.findIndex((n) => n === node);
    console.debug('\n\n INDEX IN PARETN', indexInParent)

    const contentCopy = [...node.content];
    const newNodes = [];

    let index = 0;
    let currItem = contentCopy[index];
    while (currItem) {
      console.debug('--- CURR ITEM', currItem, '\n\n')
      let newContent = [];
      if (currItem.type === 'text' && currItem.marks) {
        console.debug('--MARKS', currItem.marks,'\n')
        newContent = [{ type: 'text', text: currItem.text }]
      } else {
        newContent = [currItem];
      }
      const newItem = { type: 'run', marks: currItem.marks || null, content: newContent };
      contentToSplice.push(newItem);
      currItem = contentCopy[++index]
    }

    console.debug('\n\n CONTENT TO SPLICE', contentToSplice, '\n\n')
    console.debug('\n NODE WAS', node, parent)
    
    // for (let n in content) {
    //   if (n.type !== 'text' || !n.marks) newContent.push(n);
    // }
    // const newContent = content.map((n) => {
    //   if (n.type !== 'text' || !n.marks) return n;

    //   // Remove marks from the text node and bump them up to a new run element
    //   const newContent = [{ type: 'text', text: n.text }];
    //   return { type: 'run', marks: n.marks, content: newContent };
    // });
    parent.content.splice(indexInParent, 1, ...contentToSplice)
    node.skip = true;
    return [node];
  }

  #outputNodeToJson(node, parent = null) {
    node = this.#preProcessTextNodes(node, parent);

    let name = this.getTagName(node.type);
    const elements = [];
    const { content, attrs } = node;
    let attributes = attrs?.attributes || {};

    // Nodes that can't be mapped back to a name tag need special handling. ie: list nodes
    if (node.type === 'listItem') name = 'w:r';

    if (!name) {
      // const isList = ['orderedList', 'bulletList'].includes(node.type);
      // if (isList) { 
      //   // console.debug('List node:', node.type);

      //   const listElements = [];
      //   for (let child of content) {
      //     const processedChild = {
      //       name: 'w:p',
      //       elements: this.#outputNodeToJson(child, node),
      //       attributes: {}
      //     }
      //     // console.debug('Processed child:', processedChild);
      //     listElements.push(processedChild);
      //   }
      //   // console.debug('List elements:', listElements);
      //   return listElements;
      // }
    }

    // Standard handling of nodes
    else if (node.type !== 'text') {
      if (content) {
        for (let child of content) {
          const processedChild = this.#outputNodeToJson(child, node);
          if (Array.isArray(processedChild)) elements.push(...processedChild);
          else elements.push(processedChild)
        }
      }
    }

    // Check to see if this is going to be a text node
    const hasTextNodes = content?.some((n) => n.type === 'text');
    if (hasTextNodes && node.type !== 'text') {

      // Re-build attributes from marks
      const { marks = null } = node;
      if (marks) {
        let attributeGroup;
        if (node.type === 'run') attributeGroup= 'w:rPr';
        if (attributeGroup) {
          const attributeElements = [];
          marks.forEach((mark) => {
            const tags = this.getTagsFromMark(mark.type);
            if (!tags || !tags.length) return;

            tags.forEach((tag) => {
              attributeElements.push({
                name: tag.name,
                type: 'element'
              });
            })
          });

          elements.unshift({
            type: 'element',
            name: attributeGroup,
            elements: attributeElements,
          });

          delete attributes.runProperties;
          delete attributes.paragraphProperties;
        }
      }
    }

    // Text nodes have special handling because our Schema requires them to have no attrs and the strucutre
    // is different, so we restore the expected export structure here.
    else if (node.type === 'text' && !node.skip) {
      // Add xml:space attribute to text nodes where needed
      const hasWhitespace = /^\s|\s$/.test(node.text);
      if (hasWhitespace) attributes['xml:space'] = 'preserve';
      elements.push({
        text: node.text,
        type: 'text',
      });
    }

    const sectionProperties = attributes?.sectionProperties;
    if (sectionProperties) {
      delete attrs.attributes.sectionProperties;
      elements.push(sectionProperties)
    }

    const resultingNode = {
      name,
      elements,
      attributes: Object.keys(attributes).length ? attributes : undefined
    }

    if (SuperConverter.elements.has(name)) resultingNode.type = 'element';
    return resultingNode;
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